type TCartItem = {
  productId: string
  quantity: number
}

type TCart = {
  items: TCartItem[]
}

export default TCart
export {
  TCartItem
}
