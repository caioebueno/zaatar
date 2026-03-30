"use client";

import { calculateCartWithProgressiveDiscount } from "@/utils/calculatePrice";
import { useCart } from "./CartContext";
import formatCurrency from "@/utils/formatCurrecy";
import { TGetProductsResponse } from "../../src/getProducts";
import TCart, { TCartItem } from "@/types/cart";
import Button from "./Button";
import {
  FiArrowLeft,
  FiPlus,
  FiShoppingBag,
  FiTruck,
  FiX,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { findProductById } from "./MenuPage";
import { calculateProductPriceWithProgressiveDiscount } from "@/utils/calculateProductPriceWithProgressiveDiscount";
import { QuantitySelector } from "./ProductModal";
import { parseAsInteger, useQueryState } from "nuqs";
import PhoneInput from "./PhoneInput";
import getCustomerData from "../../src/getCustomerData";
import { useState } from "react";
import TCustomer from "../../src/types/customer";
import TextInput from "./TextInput";
import { Dialog } from "radix-ui";
import AddressAutocompleteInput, { TAddressValue } from "./AddressInput";
import addNewDeliveryAddress from "../../src/addNewDeliveryAddress";
import TAddress from "../../src/types/address";
import updateCustomerName from "../../src/updateCustomerName";
import { TOrderType, TPaymentMethod } from "../../src/types/order";
import createOrder from "../../src/createOrder";
import Link from "next/link";
import { TModifierGroup } from "@/src/types/product";

type TPrice = {
  data: TGetProductsResponse;
  cart: TCart;
};

const Price: React.FC<TPrice> = ({ data, cart }) => {
  const price = calculateCartWithProgressiveDiscount(
    data.categories,
    cart,
    data.progressiveDiscount,
  );
  const router = useRouter();

  return (
    <div className="bg-foreground p-4 border-[#B9BFBF] border-b flex flex-row justify-between sticky top-0">
      <Button
        onClick={() => router.back()}
        className="p-0! text-[16px] font-semibold text-text! bg-transparent flex flex-row gap-2 items-center"
      >
        <FiArrowLeft size={18} />
        <span>Back</span>
      </Button>
      <div className={`flex flex-row items-center gap-2.5`}>
        <div>
          <div className="bg-[#CCD0D0] rounded-md">
            {Math.floor(price.discountAmount / 100) !== 0 && (
              <span className="text-xs font-semibold text-brandBackground py-1 px-1.5">
                Won ${Math.floor(price.discountAmount / 100)}
              </span>
            )}
          </div>
        </div>
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
      </div>
    </div>
  );
};

type TCartProduct = {
  data: TGetProductsResponse;
};

type TConfirmStep = {
  onBack: () => void;
};

const ConfirmStep: React.FC<TConfirmStep> = ({ onBack }) => {
  return (
    <>
      {/*<div className="bg-foreground p-4 border-[#B9BFBF] border-b flex flex-row justify-between">
       <Button onClick={() => onBack()} className="p-0! text-[16px] font-semibold text-text! bg-transparent flex flex-row gap-2 items-center"><FiArrowLeft size={18} /><span>Back</span></Button>
     </div>
     <PaymentTypeSelector />*/}
    </>
  );
};

const CartList: React.FC<TCartProduct> = ({ data }) => {
  const { cart } = useCart();
  const [step, setStep] = useQueryState("step", parseAsInteger.withDefault(1));
  const [paymentType, setPaymentType] = useState<TPaymentMethod | null>("CARD");
  const [orderType, setOrderType] = useState<TOrderType | null>(null);
  const [selectedTip, setSelectedTip] = useState<string | null>("15");
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [customer, setCustomer] = useState<TCustomer | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState<null | string>(null);

  const router = useRouter();

  const price = calculateCartWithProgressiveDiscount(
    data.categories,
    cart,
    data.progressiveDiscount,
  );
  const priceWithTip =
    price.discountedPrice +
    (Number(selectedTip || 0) * price.discountedPrice) / 100;

  const handleConfirm = async () => {
    try {
      if (!paymentType || !selectedAddress || !customer || !orderType) return;
      setLoading(true);
      const order = await createOrder({
        cart: cart,
        orderType: "DELIVERY",
        paymentMethod: paymentType,
        customerId: customer.id,
        addressId: selectedAddress,
        tipAmount: Number(selectedTip || 0),
      });
      setLoading(false);
      router.push(`/menu/en/confirmation/${order.id}`);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  if (step === 3)
    return (
      <>
        <div className="bg-foreground p-4 border-[#B9BFBF] border-b flex flex-row justify-between">
          <Button
            onClick={() => setStep(2)}
            className="p-0! text-[16px] font-semibold text-text! bg-transparent flex flex-row gap-2 items-center"
          >
            <FiArrowLeft size={18} />
            <span>Back</span>
          </Button>
        </div>
        <div className="py-6 px-4 flex flex-col gap-4">
          <div className="py-3 px-4 rounded-xl bg-foreground flex flex-row justify-between items-center mb-2">
            <div>
              <span className="font-semibold text-sm text-lightText">
                Cart summary
              </span>
              <div>
                <div className={`flex flex-row items-center gap-2.5`}>
                  <div className="flex flex-row gap-2.5">
                    {price.fullPrice !== price.discountedPrice && (
                      <span className="font-semibold line-through">
                        {formatCurrency(price.fullPrice)}
                      </span>
                    )}
                    <span className="font-bold">
                      {formatCurrency(price.discountedPrice)}
                    </span>
                  </div>
                  <div>
                    <div className="bg-[#CCD0D0] rounded-md">
                      {Math.floor(price.discountAmount / 100) !== 0 && (
                        <span className="text-xs font-semibold text-brandBackground py-1 px-1.5">
                          ${Math.floor(price.discountAmount / 100)} off
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Button className="bg-brandBackground py-2! px-4 rounded-lg text-sm">
                View
              </Button>
            </div>
          </div>
          <div className="flex flex-row items-end gap-1">
            <TextInput label="Cupom" placeholder="Insert cupom" />
            <Button className="bg-brandBackground h-14">Verify</Button>
          </div>
          <PaymentTypeSelector
            selectedPaymentType={paymentType}
            onSelect={setPaymentType}
          />
          <TipSelector onSelect={setSelectedTip} tipSelected={selectedTip} />
        </div>
        <div className="bg-foreground pt-4 pb-8 px-4 border-[#B9BFBF] border-t fixed bottom-0 w-full flex flex-col items-center gap-2.5">
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-brandBackground w-full py-3 gap-3"
          >
            <span className="text-lg">
              {loading
                ? "Loading..."
                : `Confirm ${formatCurrency(priceWithTip)}`}
            </span>
          </Button>
        </div>
      </>
    );

  if (step === 2)
    return (
      <AddressStep
        customer={customer}
        setCustomer={setCustomer}
        selectedAddress={selectedAddress}
        setSelectedAddress={setSelectedAddress}
        onBack={() => setStep(1)}
        onNext={() => setStep(3)}
        name={name}
        setName={setName}
        orderType={orderType}
      />
    );

  return (
    <div>
      <Price cart={cart} data={data} />
      <div className="py-6 px-4 flex flex-col gap-4 pb-[220px]">
        {cart.items.length > 0 ? (
          cart.items.map((item) => (
            <CartListItem
              quantity={item.quantity}
              key={item.productId}
              data={data}
              cart={cart}
              cartItem={item}
            />
          ))
        ) : (
          <div className="flex flex-col gap-4 items-center py-12">
            <span className="text-lg font-semibold">Your cart is empty</span>
            <Link href="/menu/en">
              <Button className="w-fit bg-brandBackground">Back to menu</Button>
            </Link>
          </div>
        )}
      </div>
      {cart.items.length > 0 && (
        <div className="bg-foreground pt-4 pb-8 px-4 border-[#B9BFBF] border-t fixed bottom-0 w-full flex flex-col items-center gap-2.5">
          <span className="font-bold text-lg">Select service type</span>
          <Button
            className="bg-brandBackground w-full py-2! gap-3"
            onClick={() => {
              setStep(2);
              setOrderType("DELIVERY");
            }}
          >
            <FiTruck size={22} />
            <span className="text-lg">Delivery</span>
          </Button>
          <Button className="bg-brandBackground w-full py-2! gap-3">
            <FiShoppingBag size={22} />
            <span className="text-lg">Take Away</span>
          </Button>
        </div>
      )}
    </div>
  );
};

type TAddressStep = {
  onBack: () => void;
  onNext: () => void;
  selectedAddress: string | null;
  setSelectedAddress: (value: string) => void;
  customer: TCustomer | null;
  setCustomer: (data: TCustomer | null) => void;
  name: string | null;
  setName: (value: string | null) => void;
  orderType: TOrderType | null;
};

export type TInputError = {
  field: string;
  message: string;
} | null;

const AddressStep: React.FC<TAddressStep> = ({
  onBack,
  onNext,
  selectedAddress,
  setSelectedAddress,
  customer,
  setCustomer,
  name,
  setName,
  orderType,
}) => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [openAddress, setOpenAddress] = useState(false);
  const [error, setError] = useState<TInputError>(null);

  const handleConfirm = async () => {
    if (!customer) {
      setLoading(true);
      const customer = await getCustomerData({
        phone: phone,
      });
      setName(customer.name);
      setCustomer(customer);
      setLoading(false);
    } else {
      if (!name || name.length === 0)
        return setError({
          field: "name",
          message: "Insert you name",
        });
      if (orderType === "DELIVERY") {
        if (!selectedAddress)
          return setError({
            field: "address",
            message: "Select an address",
          });
      }
      if (!customer.name || customer.name.length === 0) {
        setLoading(true);
        await updateCustomerName({
          customerId: customer.id,
          name: name,
        });
        setLoading(false);
      }

      onNext();
    }
  };

  const handleConfirmAddress = async (data: TAddress) => {
    const customer = await getCustomerData({
      phone: phone,
    });
    setCustomer(customer);
    setSelectedAddress(data.id);
    // if (!data.address.raw.address?.house_number || !customer) return;
    // await addNewDeliveryAddress({
    //   address: {
    //     id: "",
    //     city: data.address.city,
    //     description: data.address.raw.display_name,
    //     lat: data.address.lat.toString(),
    //     lng: data.address.lon.toString(),
    //     number: data.address.raw.address?.house_number,
    //     state: data.address.state,
    //     street: data.address.street1,
    //     zipCode: data.address.zip,
    //     numberComplement: data.number || undefined,
    //     complement: data.complement || undefined,
    //     createdAt: "",
    //     customerId: customer.id,
    //   },
    // });
  };

  return (
    <div>
      <div className="bg-foreground p-4 border-[#B9BFBF] border-b flex flex-row justify-between">
        <Button
          onClick={() => onBack()}
          className="p-0! text-[16px] font-semibold text-text! bg-transparent flex flex-row gap-2 items-center"
        >
          <FiArrowLeft size={18} />
          <span>Back</span>
        </Button>
      </div>
      <div className="pt-6 px-4 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="font-semibold text-[16px]">Phone</span>
          <PhoneInput
            onClear={() => {
              setCustomer(null);
              setPhone("");
            }}
            value={phone}
            onChange={(e) => setPhone(e.raw)}
            block={customer !== null}
          />
        </div>
        {customer && (
          <>
            <TextInput
              label="Name"
              error={error?.field === "name" ? error.message : undefined}
              placeholder="Your name"
              disabled={customer.name !== null}
              value={name || ""}
              onChange={(e) => {
                setError(null);
                setName(e.target.value);
              }}
            />
            <div className="flex flex-col gap-2">
              <span className="font-semibold">Delivery address</span>
              {!customer.addresses || customer.addresses.length === 0 ? (
                <div className="py-2 flex flex-col items-center">
                  <span className="font-medium text-lightText">
                    No address added
                  </span>
                </div>
              ) : (
                <AddressSelector
                  addresses={customer.addresses}
                  onSelect={setSelectedAddress}
                  selectedAddress={selectedAddress}
                />
              )}
              <Button
                onClick={() => setOpenAddress(true)}
                className="text-[16px]! py-3  bg-brandBackground flex flex-row gap-2"
              >
                <FiPlus size={18} />
                Add new address
              </Button>
              {error && error.field === "address" && (
                <span className="text-lg text-red-600">{error.message}</span>
              )}
            </div>
          </>
        )}
      </div>
      <div className="bg-foreground pt-4 pb-8 px-4 border-[#B9BFBF] border-t fixed bottom-0 w-full flex flex-col items-center gap-2.5">
        <Button
          onClick={handleConfirm}
          disabled={loading}
          className="bg-brandBackground w-full py-3 gap-3"
        >
          <span className="text-lg">{loading ? "Loading..." : "Confirm"}</span>
        </Button>
      </div>
      <FindAddressModal
        onConfirm={handleConfirmAddress}
        onOpenChange={setOpenAddress}
        open={openAddress}
        custumerId={customer?.id}
      />
    </div>
  );
};

type TTipSelector = {
  tipSelected: string | null;
  onSelect: (value: string) => void;
};

const TipSelector: React.FC<TTipSelector> = ({ onSelect, tipSelected }) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-semibold">Tip</span>
      <div className="flex flex-rowa gap-2">
        <div
          onClick={() => onSelect("10")}
          className={`px-3 py-3 rounded-xl bg-foreground font-medium text-lg flex flex-row justify-between items-center border-2 transition ${"10" === tipSelected ? "border-brandBackground" : "border-foreground"}`}
        >
          <div>
            <span className="flex-1">%10</span>
          </div>
        </div>
        <div
          onClick={() => onSelect("15")}
          className={`px-3 py-3 rounded-xl bg-foreground font-medium text-lg flex flex-row justify-between items-center border-2 transition ${"15" === tipSelected ? "border-brandBackground" : "border-foreground"}`}
        >
          <div>
            <span className="flex-1">%15</span>
          </div>
        </div>
        <div
          onClick={() => onSelect("20")}
          className={`px-3 py-3 rounded-xl bg-foreground font-medium text-lg flex flex-row justify-between items-center border-2 transition ${"20" === tipSelected ? "border-brandBackground" : "border-foreground"}`}
        >
          <div>
            <span className="flex-1">%20</span>
          </div>
        </div>
        <div>
          <TextInput prefix="%" leftIcon="%" placeholder="Other" />
        </div>
      </div>
    </div>
  );
};

type TPaymentTypeSelector = {
  selectedPaymentType: TPaymentMethod | null;
  onSelect: (value: TPaymentMethod) => void;
};

const PaymentTypeSelector: React.FC<TPaymentTypeSelector> = ({
  onSelect,
  selectedPaymentType,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-semibold">Payment method</span>
      <div
        onClick={() => onSelect("CASH")}
        className={`px-3 py-3 rounded-xl bg-foreground font-medium text-lg flex flex-row justify-between items-center border-2 transition ${"CASH" === selectedPaymentType ? "border-brandBackground" : "border-foreground"}`}
      >
        <div>
          <span className="flex-1">Cash</span>
        </div>
        <div
          className={`h-5 w-5 flex items-center justify-center ${"CASH" === selectedPaymentType ? "border-brandBackground" : "border-[#CCD0D0]"} border-2 rounded-full`}
        >
          <div
            className={`h-3 w-3 rounded-full ${"CASH" === selectedPaymentType ? "bg-brandBackground" : "bg-transparent"}`}
          ></div>
        </div>
      </div>
      <div
        onClick={() => onSelect("CARD")}
        className={`px-3 py-3 rounded-xl bg-foreground font-medium text-lg flex flex-row justify-between items-center border-2 transition ${"CARD" === selectedPaymentType ? "border-brandBackground" : "border-foreground"}`}
      >
        <div>
          <span className="flex-1">Card</span>
        </div>
        <div
          className={`h-5 w-5 flex items-center justify-center ${"CARD" === selectedPaymentType ? "border-brandBackground" : "border-[#CCD0D0]"} border-2 rounded-full`}
        >
          <div
            className={`h-3 w-3 rounded-full ${"CARD" === selectedPaymentType ? "bg-brandBackground" : "bg-transparent"}`}
          ></div>
        </div>
      </div>
    </div>
  );
};

type TAddressSelector = {
  addresses: TAddress[];
  selectedAddress: string | null;
  onSelect: (value: string) => void;
};

const AddressSelector: React.FC<TAddressSelector> = ({
  addresses,
  onSelect,
  selectedAddress,
}) => {
  return (
    <div className="flex flex-col gap-2">
      {addresses.map((address) => (
        <div
          onClick={() => onSelect(address.id)}
          key={address.id}
          className={`px-3 py-3 rounded-xl bg-foreground font-medium text-[16px] flex flex-row justify-between items-center border-2 transition ${selectedAddress === address.id ? "border-brandBackground" : "border-foreground"}`}
        >
          <div className="flex flex-col">
            <span className="flex-1">{`${address.street}, ${address.city}`}</span>
            {address.complement && (
              <div className="text-sm text-lightText">{address.complement}</div>
            )}
          </div>
          <div
            className={`h-5 w-5 flex items-center justify-center ${address.id === selectedAddress ? "border-brandBackground" : "border-[#CCD0D0]"} border-2 rounded-full`}
          >
            <div
              className={`h-3 w-3 rounded-full ${address.id === selectedAddress ? "bg-brandBackground" : "bg-transparent"}`}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

type TFindAddressModal = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onConfirm: (data: TAddress) => Promise<void>;
  custumerId?: string;
};

const FindAddressModal: React.FC<TFindAddressModal> = ({
  onOpenChange,
  open,
  onConfirm,
  custumerId,
}) => {
  const [selectedAddress, setSelectedAddress] = useState<TAddressValue | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");

  const handleConfirm = async () => {
    if (!selectedAddress) return;
    if (!selectedAddress.raw.address?.house_number) return;
    setLoading(true);
    const address = await addNewDeliveryAddress({
      address: {
        id: "",
        city: selectedAddress.city,
        description: selectedAddress.raw.display_name,
        lat: selectedAddress.lat.toString(),
        lng: selectedAddress.lon.toString(),
        number: selectedAddress.raw.address?.house_number,
        state: selectedAddress.state,
        street: selectedAddress.street1,
        zipCode: selectedAddress.zip,
        numberComplement: number || undefined,
        complement: complement || undefined,
        createdAt: "",
        customerId: custumerId,
      },
    });
    await onConfirm(address);
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="w-dvw h-dvh bg-background fixed top-0">
        <div className="flex flex-row justify-between items-center px-4 py-3 bg-foreground border-[#CCD0D0] border-b">
          <Button className="p-2! bg-transparent text-text! opacity-0">
            <FiX />
          </Button>
          <span className="font-semibold">Add address</span>
          <Button
            onClick={() => onOpenChange(false)}
            className="p-2! bg-transparent text-text!"
          >
            <FiX size={18} />
          </Button>
        </div>
        <div className="py-4 px-4 flex flex-col gap-3">
          <AddressAutocompleteInput
            onSelect={setSelectedAddress}
            selected={selectedAddress}
          />
          {selectedAddress !== null && (
            <>
              <TextInput
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                label="Number + Appartment"
              />
              <TextInput
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                label="Reference"
              />
            </>
          )}
        </div>
        <div className="bottom-0 bg-foreground pt-4 px-4 pb-8 w-full fixed border-t border-[#CCD0D0]">
          <Button
            disabled={selectedAddress === null || loading}
            onClick={() => handleConfirm()}
            className="bg-brandBackground w-full disabled:opacity-50"
          >
            {loading ? "Loading..." : "Confirm address"}
          </Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};

type TCartListItem = {
  data: TGetProductsResponse;
  cartItem: TCartItem;
  quantity: number;
  cart: TCart;
};

const CartListItem: React.FC<TCartListItem> = ({
  data,
  cartItem,
  cart,
  quantity,
}) => {
  // const [quantity, setQuantity] = useState(cart.quantity)
  const { updateItemQuantity } = useCart();
  const price = calculateProductPriceWithProgressiveDiscount(
    cartItem.productId,
    data.progressiveDiscount,
    cart,
    data.categories,
  );

  const findProduct = findProductById(data.categories, cartItem.productId);
  const image = findProduct?.photos ? findProduct.photos[0]?.url : null;
  const selectedModifiers = findProduct?.modifierGroups?.filter((item) =>
    cartItem.modifiers?.find((modifier) => modifier.modifierId === item.id),
  );

  return (
    <div className="flex flex-row items-center justify-between w-full">
      <div className="flex flex-row gap-3 items-center">
        <img src={image} className="h-20 w-20 rounded-lg" />
        <div className="flex flex-col gap-1.5">
          <span className="font-semibold ">{findProduct?.name}</span>
          {cartItem.modifiers?.map((item) => (
            <ModifierItem
              key={item.modifierItemId}
              modifiers={findProduct?.modifierGroups || []}
              modifierItemId={item.modifierItemId}
            />
          ))}
          {cartItem.description && (
            <p className="text-sm text-lightText font-medium">
              {cartItem.description}
            </p>
          )}
          <div>
            <div className={`flex flex-row items-center gap-2 pt-1`}>
              <div>
                <div className="bg-[#CCD0D0] rounded-md">
                  {price && Math.floor(price.discountAmount / 100) !== 0 && (
                    <span className="text-xs font-semibold text-brandBackground py-0.5 px-1">
                      Won ${Math.floor(price.discountAmount / 100)}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[16px] font-bold">
                {price && formatCurrency(price.discountedPrice)}
              </span>
              {price && price.fullPrice !== price.discountedPrice && (
                <span className="text-sm font-semibold line-through">
                  {formatCurrency(price.fullPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div>
        <QuantitySelector
          value={quantity}
          onChange={(value) => updateItemQuantity(cartItem.productId, value)}
          small
          min={0}
        />
      </div>
    </div>
  );
};

const ModifierItem: React.FC<{
  modifierItemId: string;
  modifiers: TModifierGroup[];
}> = ({ modifierItemId, modifiers }) => {
  const findModifier = modifiers.find((item) =>
    item.items.find((modifier) => modifier.id === modifierItemId),
  );
  const findModifierItem = findModifier?.items.find(
    (modifier) => modifier.id === modifierItemId,
  );
  return (
    <span>
      <span className="text-sm font-medium text-lightText">
        {findModifierItem?.name}
      </span>
    </span>
  );
};

export default Price;
export { CartList };
