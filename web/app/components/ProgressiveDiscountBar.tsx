import { isProgressiveDiscountStepMet } from "@/utils/isProgressiveDiscountStepMet"
import TProgressiveDiscount, { TProgressiveDiscountStep } from "../../../src/types/progressiveDiscount"
import { FiStar } from 'react-icons/fi'
import TCart from "@/types/cart"
import TCategory from "../../../src/types/category"
import { getProgressiveDiscountStepProgress } from "@/utils/getProgressiveDiscountStepProgress"

type TProgressiveDiscountBar = {
  progressiveDiscount: TProgressiveDiscount
  cart?: TCart
  categories?: TCategory[]
  countPrice?: number
}

const ProgressiveDiscountBar: React.FC<TProgressiveDiscountBar> = ({
  progressiveDiscount,
  cart,
  categories,
  countPrice
}) => {
    return (
      <div className="flex flex-row items-center gap-[-5px]">
        <div className="bg-brandBackground h-6 w-6 rounded-full z-20"></div>
        {progressiveDiscount.steps.map(step => (
          <ProgressiveDiscountBarStep progressiveDiscountStep={step} key={step.id} cart={cart} categories={categories} countPrice={countPrice} progressiveDiscountSteps={progressiveDiscount.steps} />
        ))}
      </div>
    )
}

type TProgressiveDiscountBarStep = {
  progressiveDiscountStep: TProgressiveDiscountStep
  progressiveDiscountSteps?: TProgressiveDiscountStep[]
  cart?: TCart
  categories?: TCategory[]
  countPrice?: number
}

const ProgressiveDiscountBarStep: React.FC<TProgressiveDiscountBarStep> = ({
  progressiveDiscountStep,
  cart,
  categories,
  countPrice,
  progressiveDiscountSteps
}) => {
  const active = cart && categories ? isProgressiveDiscountStepMet(progressiveDiscountStep, cart, categories) : false

  const progress = countPrice && progressiveDiscountSteps ? getProgressiveDiscountStepProgress(progressiveDiscountStep, progressiveDiscountSteps, countPrice) : 0

  if(progressiveDiscountStep.type === 'GIFT') return (
    <>
      <div className={`h-2.5 -m-0.5 flex-1 bg-background `}>
        <div
          style={{
            width: active ? '100%' : progress>0 ? `${progress}%` :  0,
            height: '10px',
            background: '#304240'
          }}
          className="transition-all duration-1000"
        >

        </div>
      </div>
      <div className={`p-2.5 text-sm font-bold bg-background rounded-full ${active ? 'bg-brandBackground text-white' : 'bg-background'}`}>
          <FiStar fill="#F7CA37" color="#F7CA37" size={20}></FiStar>
      </div>
    </>
  )
  return (
    <>
      <div className={`h-2.5 -m-0.5 flex-1 bg-background `}>
        <div
          style={{
            width: active ? '100%' : progress>0 ? `${progress}%` :  0,
            height: '10px',
            background: '#304240'
          }}
          className="transition-all duration-1000"
        >

        </div>
      </div>
      <div className={`p-2.5 text-sm z-10 font-bold rounded-full transition-all duration-1000 ${active ? 'bg-brandBackground text-white' : 'bg-background'}`}>
        <span className="text-nowrap">%{progressiveDiscountStep.discount} off</span>
      </div>
    </>
  )
}

export default ProgressiveDiscountBar
