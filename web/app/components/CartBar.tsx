import { calculateCartWithProgressiveDiscount } from "@/utils/calculatePrice";
import { TGetProductsResponse } from "../../src/getProducts";
import Button from "./Button";
import ProgressiveDiscountBar from "./ProgressiveDiscountBar";
import { useCart } from "./CartContext";
import formatCurrency from "@/utils/formatCurrecy";
import { useState } from "react";
import Link from "next/link";
import { useLayoutEffect } from "radix-ui/internal";
import { getCartTotalQuantity } from "@/utils/getCartTotalQuantity";

type TCartBar = {
  data: TGetProductsResponse;
};

const CartBar: React.FC<TCartBar> = ({ data }) => {
  const { cart } = useCart();
  const price = calculateCartWithProgressiveDiscount(
    data.categories,
    cart,
    data.progressiveDiscount,
  );

  const [animate, setAnimate] = useState(false);

  useLayoutEffect(() => {
    setAnimate(true);

    const timeout = setTimeout(() => {
      setAnimate(false);
    }, 2500);

    return () => clearTimeout(timeout);
  }, [price.discountedPrice]);

  return (
    <div className="p-4 bg-foreground fixed bottom-0 w-full flex flex-col box-shadow">
      <div className="flex flex-row justify-between">
        <span className="text-sm font-bold">Progressive Discount</span>
        <span className="text- font-semibold underline text-sm text-lightText">
          Learn more
        </span>
      </div>
      {data.progressiveDiscount && (
        <div className="pb-6 pt-4">
          <ProgressiveDiscountBar
            progressiveDiscount={data.progressiveDiscount}
            cart={cart}
            categories={data.categories}
            countPrice={price.discountedPrice}
          />
        </div>
      )}
      <div className="flex flex-row items-center justify-between">
        <div
          className={`flex flex-row items-center gap-2.5 ${animate ? "flex animate-bounce" : "flex"}`}
        >
          <div className="flex flex-col">
            {price.fullPrice !== price.discountedPrice && (
              <span className="text-sm font-semibold line-through">
                {formatCurrency(price.fullPrice)}
              </span>
            )}
            <span className="text-[22px] font-bold">
              {formatCurrency(price.discountedPrice)}
            </span>
          </div>
          <div>
            <div className="bg-[#CCD0D0] rounded-md">
              {Math.floor(price.discountAmount / 100) !== 0 && (
                <span className="text-xs font-semibold text-brandBackground py-1 px-1.5">
                  Won ${Math.floor(price.discountAmount / 100)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div>
          <Link href="/menu/en/cart">
            <Button className="py-3 px-8 bg-brandBackground text-[16px]">
              My Cart{" "}
              {cart.items.length > 0 ? `(${getCartTotalQuantity(cart)})` : null}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartBar;
