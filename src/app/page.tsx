"use client";
import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";

import PreviousIcon from "@/assets/svg/previousIcon.svg";
import { createCalendar } from "@/hook/createCalendar";
import { splitArray } from "@/hook/splitArray";
import DayBox from "@/components/DayBox/DayBox";
import { matchingDateType } from "@/hook/matchingDateType";
import { Button } from "@/components/Button/Button";
import Tooltip from "@/components/Tooltip/Tooltip";
import { createWrittenArr } from "@/hook/createWrittenArr";
import { converDate } from "@/hook/converDate";
import DateRangeContainer from "@/components/DateRangeContainer/DataRangeContainer";
import { returnTooltipCondition } from "@/hook/returnTooltipCondition";
import { redirectGoogleForm } from "@/hook/redirectGoogleForm";
import LoadingBox from "@/components/LoadingBox/LoadingBox";
import { UserInfoType } from "@/types/UserInfo";
import CalendarBox from "@/components/CalendarBox/CalendarBox";
import LoadingIcon from "@/assets/svg/loadingIconGray.svg"; //회색버전

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSelectedDate, setIsSelectedDate] = useState<Date | null>(null);
  const [isAnyDateClicked, setIsAnyDateClicked] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfoType>();
  const [writtenDays, setWrittenDays] = useState<string[]>([]);
  const [isDisable, setIsDisable] = useState<boolean>(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const days = createCalendar({ year: currentYear, month: currentMonth });
  const splitArr = splitArray(days, 7);
  const router = useRouter();
  const yearMonth = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  const handleDayBoxCLick = (date: Date | null) => {
    if (!date) return;
    setIsAnyDateClicked(true);
    setIsSelectedDate(date);
  };

  const fetchDiaryData = async () => {
    if (!userInfo?.user_id) return;

    try {
      const response = await fetch(
        `/api/diary?userId=${userInfo.user_id}&yearMonth=${yearMonth}`,
        {
          method: "GET",
        },
      );
      const data = await response.json();

      if (response.ok) {
        const dates = data.data.dates || [];
        setWrittenDays(createWrittenArr({ writtenDays: dates, yearMonth }));
      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    // 선택된 날짜가 없으면 오늘 날짜 기준으로 체크
    const dateToCheck = isSelectedDate || today;
    const dateStr = converDate({ date: dateToCheck });
    const todayStr = converDate({ date: today });

    setIsDisable(
      dateStr !== todayStr ||
        (dateStr === todayStr && writtenDays.includes(todayStr)),
    );
  }, [isSelectedDate, writtenDays, today]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const getUserInfo = async (userId: string, token: string) => {
      try {
        const { data } = await api.get<UserInfoType>("/user/info", {
          headers: {
            userId,
            Authorization: token,
          },
        });
        if (data) {
          setUserInfo(data);
        }
      } catch (e) {
        console.error(e);
      }
    };

    if (!userId && !token) {
      router.push("/auth/login");
    }
    if (userId && token) {
      getUserInfo(userId, token);
    }
  }, [router]);

  const handleNextMonth = () => {
    if (userInfo) {
      const endDate = new Date(userInfo.access_end);
      const endYear = endDate.getFullYear();
      const endMonth = endDate.getMonth() + 1;

      if (
        currentYear > endYear ||
        (currentYear === endYear && currentMonth >= endMonth)
      ) {
        return;
      }

      setCurrentDate(new Date(currentYear, currentMonth, 1));
    }
  };

  const handlePrevMonth = () => {
    if (userInfo) {
      const startDate = new Date(userInfo.access_start);
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth() + 1;

      if (
        currentYear < startYear ||
        (currentYear === startYear && currentMonth <= startMonth)
      ) {
        return;
      }

      setCurrentDate(new Date(currentYear, currentMonth - 2, 1));
    }
  };

  const recordWrittenDay = async () => {
    const token = localStorage.getItem("token");

    if (!token) return;
    try {
      const data = await fetch(`/api/diary`, {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userInfo?.user_id,
          date: today,
        }),
      });

      if (data.ok) {
        console.log("기록 성공");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // useEffect 수정
  useEffect(() => {
    // userInfo가 있을 때만 fetchDiaryData 실행
    if (userInfo?.user_id) {
      fetchDiaryData();
    }
  }, [yearMonth, userInfo]); // use

  return (
    <div className="flex-1 pb-[44px] mobleHeight:pb-[25px] bg-white px-6 flex flex-col justify-between">
      <div>
        <div className="mt-[28px] mobleHeight:mt-[14px]">
          <h1 className="text-gray-primary text-[32px] mobleHeight:text-[26px] font-bold break-words">
            수면 일기
          </h1>
          <p className="text-gray-tertiary text-[16px] font-[500] mt-3">
            {userInfo
              ? `사용 기간: ${userInfo.access_start.split(" ")[0]} ~ ${
                  userInfo.access_end.split(" ")[0]
                }`
              : "데이터를 불러오고 있습니다."}
          </p>
        </div>
        <div className="w-full flex flex-col mt-[34px] mobleHeight:mt-[8px]">
          <div className="w-[100%] flex items-center justify-between">
            <div className="w-[7px] h-[12px]" onClick={handlePrevMonth}>
              <Image src={PreviousIcon} alt="왼쪽화살표" />
            </div>
            <p className="text-gray-primary text-[20px] mobleHeight:text-[14px] font-[600]">
              {`${currentYear}년 ${currentMonth}월`}
            </p>
            <div
              className="w-[7px] h-[12px] rotate-180"
              onClick={handleNextMonth}
            >
              <Image src={PreviousIcon} alt="오른쪽화살표" />
            </div>
          </div>
        </div>
        {userInfo && writtenDays ? (
          <CalendarBox
            dateArr={splitArr}
            userInfo={userInfo}
            isSelectedDate={isSelectedDate}
            writtenDays={writtenDays}
            currentDate={currentDate}
            handleDayBoxCLick={handleDayBoxCLick}
            isAnyDateClicked={isAnyDateClicked}
          />
        ) : (
          <LoadingBox />
        )}
      </div>
      <div>
        {isSelectedDate &&
          isSelectedDate.getTime() !== startOfToday.getTime() && (
            <Tooltip
              statusCode={returnTooltipCondition({
                selectedDate: isSelectedDate,
                today,
              })}
            />
          )}
        <Button
          disabled={isDisable}
          onClick={() => {
            recordWrittenDay();
            redirectGoogleForm(userInfo?.name || null);
          }}
        >
          {userInfo ? (
            isSelectedDate ? (
              isSelectedDate.getTime() !== startOfToday.getTime() ? (
                "수면일기 작성불가"
              ) : writtenDays.includes(converDate({ date: today })) ? (
                "수면일기 작성완료"
              ) : (
                "수면일기 작성하기"
              )
            ) : writtenDays.includes(converDate({ date: today })) ? (
              "수면일기 작성완료"
            ) : (
              "수면일기 작성하기"
            )
          ) : (
            <div className={"animate-spin"}>
              <Image
                src={LoadingIcon}
                alt={"로딩아이콘"}
                width={40}
                height={40}
              />
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
