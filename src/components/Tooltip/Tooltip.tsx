import Image from "next/image";
import BubbleTail from "@/assets/svg/bubbleTail.svg";

type TooltipStatusCode = 0 | 1 | 2;

const Tooltip = ({ statusCode }: { statusCode: TooltipStatusCode }) => {
  const status = {
    0: "",
    1: "아직은 작성할 수 없어요 😵",
    2: "이전 기록은 작성할 수 없어요 😭",
  } as const;

  return (
    <div className={"flex flex-col justify-center"}>
      <div
        className={
          " w-fit py-[8px] px-[20px] rounded-[8px] bg-toolTip-primary  text-[12px] mx-auto"
        }
      >
        {status[statusCode]}
      </div>
      <div className={"rotate-180 mx-auto "}>
        <Image src={BubbleTail} width={15} height={15} alt={"말풍선 꼬리"} />
      </div>
    </div>
  );
};

export default Tooltip;
