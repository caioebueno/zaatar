
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model ProgressiveDiscount
 * 
 */
export type ProgressiveDiscount = $Result.DefaultSelection<Prisma.$ProgressiveDiscountPayload>
/**
 * Model ProgressiveDiscountStep
 * 
 */
export type ProgressiveDiscountStep = $Result.DefaultSelection<Prisma.$ProgressiveDiscountStepPayload>
/**
 * Model File
 * 
 */
export type File = $Result.DefaultSelection<Prisma.$FilePayload>
/**
 * Model ModifierGroup
 * 
 */
export type ModifierGroup = $Result.DefaultSelection<Prisma.$ModifierGroupPayload>
/**
 * Model Business
 * 
 */
export type Business = $Result.DefaultSelection<Prisma.$BusinessPayload>
/**
 * Model Branch
 * 
 */
export type Branch = $Result.DefaultSelection<Prisma.$BranchPayload>
/**
 * Model Address
 * 
 */
export type Address = $Result.DefaultSelection<Prisma.$AddressPayload>
/**
 * Model Product
 * 
 */
export type Product = $Result.DefaultSelection<Prisma.$ProductPayload>
/**
 * Model Category
 * 
 */
export type Category = $Result.DefaultSelection<Prisma.$CategoryPayload>
/**
 * Model Campaign
 * 
 */
export type Campaign = $Result.DefaultSelection<Prisma.$CampaignPayload>
/**
 * Model Customer
 * 
 */
export type Customer = $Result.DefaultSelection<Prisma.$CustomerPayload>
/**
 * Model DeliveryAddress
 * 
 */
export type DeliveryAddress = $Result.DefaultSelection<Prisma.$DeliveryAddressPayload>
/**
 * Model Message
 * 
 */
export type Message = $Result.DefaultSelection<Prisma.$MessagePayload>
/**
 * Model PromotialMessage
 * 
 */
export type PromotialMessage = $Result.DefaultSelection<Prisma.$PromotialMessagePayload>
/**
 * Model Order
 * 
 */
export type Order = $Result.DefaultSelection<Prisma.$OrderPayload>
/**
 * Model OrderProducts
 * 
 */
export type OrderProducts = $Result.DefaultSelection<Prisma.$OrderProductsPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const ProgressiveDiscountStepType: {
  PERCENTAGEDISCOUNT: 'PERCENTAGEDISCOUNT',
  GIFT: 'GIFT'
};

export type ProgressiveDiscountStepType = (typeof ProgressiveDiscountStepType)[keyof typeof ProgressiveDiscountStepType]


export const ModifierGroupType: {
  MULTI: 'MULTI',
  SINGLE: 'SINGLE'
};

export type ModifierGroupType = (typeof ModifierGroupType)[keyof typeof ModifierGroupType]


export const PaymentType: {
  CASH: 'CASH',
  CARD: 'CARD',
  ZELLE: 'ZELLE'
};

export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType]


export const OrderType: {
  DELIVERY: 'DELIVERY',
  TAKEAWAY: 'TAKEAWAY'
};

export type OrderType = (typeof OrderType)[keyof typeof OrderType]

}

export type ProgressiveDiscountStepType = $Enums.ProgressiveDiscountStepType

export const ProgressiveDiscountStepType: typeof $Enums.ProgressiveDiscountStepType

export type ModifierGroupType = $Enums.ModifierGroupType

export const ModifierGroupType: typeof $Enums.ModifierGroupType

export type PaymentType = $Enums.PaymentType

export const PaymentType: typeof $Enums.PaymentType

export type OrderType = $Enums.OrderType

export const OrderType: typeof $Enums.OrderType

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more ProgressiveDiscounts
 * const progressiveDiscounts = await prisma.progressiveDiscount.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more ProgressiveDiscounts
   * const progressiveDiscounts = await prisma.progressiveDiscount.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.progressiveDiscount`: Exposes CRUD operations for the **ProgressiveDiscount** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ProgressiveDiscounts
    * const progressiveDiscounts = await prisma.progressiveDiscount.findMany()
    * ```
    */
  get progressiveDiscount(): Prisma.ProgressiveDiscountDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.progressiveDiscountStep`: Exposes CRUD operations for the **ProgressiveDiscountStep** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ProgressiveDiscountSteps
    * const progressiveDiscountSteps = await prisma.progressiveDiscountStep.findMany()
    * ```
    */
  get progressiveDiscountStep(): Prisma.ProgressiveDiscountStepDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.file`: Exposes CRUD operations for the **File** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Files
    * const files = await prisma.file.findMany()
    * ```
    */
  get file(): Prisma.FileDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.modifierGroup`: Exposes CRUD operations for the **ModifierGroup** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ModifierGroups
    * const modifierGroups = await prisma.modifierGroup.findMany()
    * ```
    */
  get modifierGroup(): Prisma.ModifierGroupDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.business`: Exposes CRUD operations for the **Business** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Businesses
    * const businesses = await prisma.business.findMany()
    * ```
    */
  get business(): Prisma.BusinessDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.branch`: Exposes CRUD operations for the **Branch** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Branches
    * const branches = await prisma.branch.findMany()
    * ```
    */
  get branch(): Prisma.BranchDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.address`: Exposes CRUD operations for the **Address** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Addresses
    * const addresses = await prisma.address.findMany()
    * ```
    */
  get address(): Prisma.AddressDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.product`: Exposes CRUD operations for the **Product** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Products
    * const products = await prisma.product.findMany()
    * ```
    */
  get product(): Prisma.ProductDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.category`: Exposes CRUD operations for the **Category** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Categories
    * const categories = await prisma.category.findMany()
    * ```
    */
  get category(): Prisma.CategoryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.campaign`: Exposes CRUD operations for the **Campaign** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Campaigns
    * const campaigns = await prisma.campaign.findMany()
    * ```
    */
  get campaign(): Prisma.CampaignDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.customer`: Exposes CRUD operations for the **Customer** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Customers
    * const customers = await prisma.customer.findMany()
    * ```
    */
  get customer(): Prisma.CustomerDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.deliveryAddress`: Exposes CRUD operations for the **DeliveryAddress** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more DeliveryAddresses
    * const deliveryAddresses = await prisma.deliveryAddress.findMany()
    * ```
    */
  get deliveryAddress(): Prisma.DeliveryAddressDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.message`: Exposes CRUD operations for the **Message** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Messages
    * const messages = await prisma.message.findMany()
    * ```
    */
  get message(): Prisma.MessageDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.promotialMessage`: Exposes CRUD operations for the **PromotialMessage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PromotialMessages
    * const promotialMessages = await prisma.promotialMessage.findMany()
    * ```
    */
  get promotialMessage(): Prisma.PromotialMessageDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.order`: Exposes CRUD operations for the **Order** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Orders
    * const orders = await prisma.order.findMany()
    * ```
    */
  get order(): Prisma.OrderDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.orderProducts`: Exposes CRUD operations for the **OrderProducts** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more OrderProducts
    * const orderProducts = await prisma.orderProducts.findMany()
    * ```
    */
  get orderProducts(): Prisma.OrderProductsDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.12.0
   * Query Engine version: 8047c96bbd92db98a2abc7c9323ce77c02c89dbc
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    ProgressiveDiscount: 'ProgressiveDiscount',
    ProgressiveDiscountStep: 'ProgressiveDiscountStep',
    File: 'File',
    ModifierGroup: 'ModifierGroup',
    Business: 'Business',
    Branch: 'Branch',
    Address: 'Address',
    Product: 'Product',
    Category: 'Category',
    Campaign: 'Campaign',
    Customer: 'Customer',
    DeliveryAddress: 'DeliveryAddress',
    Message: 'Message',
    PromotialMessage: 'PromotialMessage',
    Order: 'Order',
    OrderProducts: 'OrderProducts'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "progressiveDiscount" | "progressiveDiscountStep" | "file" | "modifierGroup" | "business" | "branch" | "address" | "product" | "category" | "campaign" | "customer" | "deliveryAddress" | "message" | "promotialMessage" | "order" | "orderProducts"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      ProgressiveDiscount: {
        payload: Prisma.$ProgressiveDiscountPayload<ExtArgs>
        fields: Prisma.ProgressiveDiscountFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProgressiveDiscountFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProgressiveDiscountFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountPayload>
          }
          findFirst: {
            args: Prisma.ProgressiveDiscountFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProgressiveDiscountFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountPayload>
          }
          findMany: {
            args: Prisma.ProgressiveDiscountFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountPayload>[]
          }
          create: {
            args: Prisma.ProgressiveDiscountCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountPayload>
          }
          createMany: {
            args: Prisma.ProgressiveDiscountCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProgressiveDiscountCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountPayload>[]
          }
          delete: {
            args: Prisma.ProgressiveDiscountDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountPayload>
          }
          update: {
            args: Prisma.ProgressiveDiscountUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountPayload>
          }
          deleteMany: {
            args: Prisma.ProgressiveDiscountDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProgressiveDiscountUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ProgressiveDiscountUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountPayload>[]
          }
          upsert: {
            args: Prisma.ProgressiveDiscountUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountPayload>
          }
          aggregate: {
            args: Prisma.ProgressiveDiscountAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProgressiveDiscount>
          }
          groupBy: {
            args: Prisma.ProgressiveDiscountGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProgressiveDiscountGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProgressiveDiscountCountArgs<ExtArgs>
            result: $Utils.Optional<ProgressiveDiscountCountAggregateOutputType> | number
          }
        }
      }
      ProgressiveDiscountStep: {
        payload: Prisma.$ProgressiveDiscountStepPayload<ExtArgs>
        fields: Prisma.ProgressiveDiscountStepFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProgressiveDiscountStepFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountStepPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProgressiveDiscountStepFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountStepPayload>
          }
          findFirst: {
            args: Prisma.ProgressiveDiscountStepFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountStepPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProgressiveDiscountStepFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountStepPayload>
          }
          findMany: {
            args: Prisma.ProgressiveDiscountStepFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountStepPayload>[]
          }
          create: {
            args: Prisma.ProgressiveDiscountStepCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountStepPayload>
          }
          createMany: {
            args: Prisma.ProgressiveDiscountStepCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProgressiveDiscountStepCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountStepPayload>[]
          }
          delete: {
            args: Prisma.ProgressiveDiscountStepDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountStepPayload>
          }
          update: {
            args: Prisma.ProgressiveDiscountStepUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountStepPayload>
          }
          deleteMany: {
            args: Prisma.ProgressiveDiscountStepDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProgressiveDiscountStepUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ProgressiveDiscountStepUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountStepPayload>[]
          }
          upsert: {
            args: Prisma.ProgressiveDiscountStepUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgressiveDiscountStepPayload>
          }
          aggregate: {
            args: Prisma.ProgressiveDiscountStepAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProgressiveDiscountStep>
          }
          groupBy: {
            args: Prisma.ProgressiveDiscountStepGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProgressiveDiscountStepGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProgressiveDiscountStepCountArgs<ExtArgs>
            result: $Utils.Optional<ProgressiveDiscountStepCountAggregateOutputType> | number
          }
        }
      }
      File: {
        payload: Prisma.$FilePayload<ExtArgs>
        fields: Prisma.FileFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FileFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FilePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FileFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FilePayload>
          }
          findFirst: {
            args: Prisma.FileFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FilePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FileFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FilePayload>
          }
          findMany: {
            args: Prisma.FileFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FilePayload>[]
          }
          create: {
            args: Prisma.FileCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FilePayload>
          }
          createMany: {
            args: Prisma.FileCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.FileCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FilePayload>[]
          }
          delete: {
            args: Prisma.FileDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FilePayload>
          }
          update: {
            args: Prisma.FileUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FilePayload>
          }
          deleteMany: {
            args: Prisma.FileDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FileUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.FileUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FilePayload>[]
          }
          upsert: {
            args: Prisma.FileUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FilePayload>
          }
          aggregate: {
            args: Prisma.FileAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFile>
          }
          groupBy: {
            args: Prisma.FileGroupByArgs<ExtArgs>
            result: $Utils.Optional<FileGroupByOutputType>[]
          }
          count: {
            args: Prisma.FileCountArgs<ExtArgs>
            result: $Utils.Optional<FileCountAggregateOutputType> | number
          }
        }
      }
      ModifierGroup: {
        payload: Prisma.$ModifierGroupPayload<ExtArgs>
        fields: Prisma.ModifierGroupFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ModifierGroupFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModifierGroupPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ModifierGroupFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModifierGroupPayload>
          }
          findFirst: {
            args: Prisma.ModifierGroupFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModifierGroupPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ModifierGroupFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModifierGroupPayload>
          }
          findMany: {
            args: Prisma.ModifierGroupFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModifierGroupPayload>[]
          }
          create: {
            args: Prisma.ModifierGroupCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModifierGroupPayload>
          }
          createMany: {
            args: Prisma.ModifierGroupCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ModifierGroupCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModifierGroupPayload>[]
          }
          delete: {
            args: Prisma.ModifierGroupDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModifierGroupPayload>
          }
          update: {
            args: Prisma.ModifierGroupUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModifierGroupPayload>
          }
          deleteMany: {
            args: Prisma.ModifierGroupDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ModifierGroupUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ModifierGroupUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModifierGroupPayload>[]
          }
          upsert: {
            args: Prisma.ModifierGroupUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModifierGroupPayload>
          }
          aggregate: {
            args: Prisma.ModifierGroupAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateModifierGroup>
          }
          groupBy: {
            args: Prisma.ModifierGroupGroupByArgs<ExtArgs>
            result: $Utils.Optional<ModifierGroupGroupByOutputType>[]
          }
          count: {
            args: Prisma.ModifierGroupCountArgs<ExtArgs>
            result: $Utils.Optional<ModifierGroupCountAggregateOutputType> | number
          }
        }
      }
      Business: {
        payload: Prisma.$BusinessPayload<ExtArgs>
        fields: Prisma.BusinessFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BusinessFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BusinessPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BusinessFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BusinessPayload>
          }
          findFirst: {
            args: Prisma.BusinessFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BusinessPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BusinessFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BusinessPayload>
          }
          findMany: {
            args: Prisma.BusinessFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BusinessPayload>[]
          }
          create: {
            args: Prisma.BusinessCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BusinessPayload>
          }
          createMany: {
            args: Prisma.BusinessCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BusinessCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BusinessPayload>[]
          }
          delete: {
            args: Prisma.BusinessDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BusinessPayload>
          }
          update: {
            args: Prisma.BusinessUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BusinessPayload>
          }
          deleteMany: {
            args: Prisma.BusinessDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BusinessUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.BusinessUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BusinessPayload>[]
          }
          upsert: {
            args: Prisma.BusinessUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BusinessPayload>
          }
          aggregate: {
            args: Prisma.BusinessAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBusiness>
          }
          groupBy: {
            args: Prisma.BusinessGroupByArgs<ExtArgs>
            result: $Utils.Optional<BusinessGroupByOutputType>[]
          }
          count: {
            args: Prisma.BusinessCountArgs<ExtArgs>
            result: $Utils.Optional<BusinessCountAggregateOutputType> | number
          }
        }
      }
      Branch: {
        payload: Prisma.$BranchPayload<ExtArgs>
        fields: Prisma.BranchFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BranchFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BranchPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BranchFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BranchPayload>
          }
          findFirst: {
            args: Prisma.BranchFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BranchPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BranchFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BranchPayload>
          }
          findMany: {
            args: Prisma.BranchFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BranchPayload>[]
          }
          create: {
            args: Prisma.BranchCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BranchPayload>
          }
          createMany: {
            args: Prisma.BranchCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BranchCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BranchPayload>[]
          }
          delete: {
            args: Prisma.BranchDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BranchPayload>
          }
          update: {
            args: Prisma.BranchUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BranchPayload>
          }
          deleteMany: {
            args: Prisma.BranchDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BranchUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.BranchUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BranchPayload>[]
          }
          upsert: {
            args: Prisma.BranchUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BranchPayload>
          }
          aggregate: {
            args: Prisma.BranchAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBranch>
          }
          groupBy: {
            args: Prisma.BranchGroupByArgs<ExtArgs>
            result: $Utils.Optional<BranchGroupByOutputType>[]
          }
          count: {
            args: Prisma.BranchCountArgs<ExtArgs>
            result: $Utils.Optional<BranchCountAggregateOutputType> | number
          }
        }
      }
      Address: {
        payload: Prisma.$AddressPayload<ExtArgs>
        fields: Prisma.AddressFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AddressFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AddressPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AddressFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AddressPayload>
          }
          findFirst: {
            args: Prisma.AddressFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AddressPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AddressFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AddressPayload>
          }
          findMany: {
            args: Prisma.AddressFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AddressPayload>[]
          }
          create: {
            args: Prisma.AddressCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AddressPayload>
          }
          createMany: {
            args: Prisma.AddressCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AddressCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AddressPayload>[]
          }
          delete: {
            args: Prisma.AddressDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AddressPayload>
          }
          update: {
            args: Prisma.AddressUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AddressPayload>
          }
          deleteMany: {
            args: Prisma.AddressDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AddressUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AddressUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AddressPayload>[]
          }
          upsert: {
            args: Prisma.AddressUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AddressPayload>
          }
          aggregate: {
            args: Prisma.AddressAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAddress>
          }
          groupBy: {
            args: Prisma.AddressGroupByArgs<ExtArgs>
            result: $Utils.Optional<AddressGroupByOutputType>[]
          }
          count: {
            args: Prisma.AddressCountArgs<ExtArgs>
            result: $Utils.Optional<AddressCountAggregateOutputType> | number
          }
        }
      }
      Product: {
        payload: Prisma.$ProductPayload<ExtArgs>
        fields: Prisma.ProductFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProductFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProductFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          findFirst: {
            args: Prisma.ProductFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProductFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          findMany: {
            args: Prisma.ProductFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>[]
          }
          create: {
            args: Prisma.ProductCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          createMany: {
            args: Prisma.ProductCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProductCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>[]
          }
          delete: {
            args: Prisma.ProductDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          update: {
            args: Prisma.ProductUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          deleteMany: {
            args: Prisma.ProductDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProductUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ProductUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>[]
          }
          upsert: {
            args: Prisma.ProductUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          aggregate: {
            args: Prisma.ProductAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProduct>
          }
          groupBy: {
            args: Prisma.ProductGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProductGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProductCountArgs<ExtArgs>
            result: $Utils.Optional<ProductCountAggregateOutputType> | number
          }
        }
      }
      Category: {
        payload: Prisma.$CategoryPayload<ExtArgs>
        fields: Prisma.CategoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CategoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CategoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          findFirst: {
            args: Prisma.CategoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CategoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          findMany: {
            args: Prisma.CategoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          create: {
            args: Prisma.CategoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          createMany: {
            args: Prisma.CategoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CategoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          delete: {
            args: Prisma.CategoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          update: {
            args: Prisma.CategoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          deleteMany: {
            args: Prisma.CategoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CategoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CategoryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          upsert: {
            args: Prisma.CategoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          aggregate: {
            args: Prisma.CategoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCategory>
          }
          groupBy: {
            args: Prisma.CategoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<CategoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.CategoryCountArgs<ExtArgs>
            result: $Utils.Optional<CategoryCountAggregateOutputType> | number
          }
        }
      }
      Campaign: {
        payload: Prisma.$CampaignPayload<ExtArgs>
        fields: Prisma.CampaignFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CampaignFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CampaignPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CampaignFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CampaignPayload>
          }
          findFirst: {
            args: Prisma.CampaignFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CampaignPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CampaignFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CampaignPayload>
          }
          findMany: {
            args: Prisma.CampaignFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CampaignPayload>[]
          }
          create: {
            args: Prisma.CampaignCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CampaignPayload>
          }
          createMany: {
            args: Prisma.CampaignCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CampaignCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CampaignPayload>[]
          }
          delete: {
            args: Prisma.CampaignDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CampaignPayload>
          }
          update: {
            args: Prisma.CampaignUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CampaignPayload>
          }
          deleteMany: {
            args: Prisma.CampaignDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CampaignUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CampaignUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CampaignPayload>[]
          }
          upsert: {
            args: Prisma.CampaignUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CampaignPayload>
          }
          aggregate: {
            args: Prisma.CampaignAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCampaign>
          }
          groupBy: {
            args: Prisma.CampaignGroupByArgs<ExtArgs>
            result: $Utils.Optional<CampaignGroupByOutputType>[]
          }
          count: {
            args: Prisma.CampaignCountArgs<ExtArgs>
            result: $Utils.Optional<CampaignCountAggregateOutputType> | number
          }
        }
      }
      Customer: {
        payload: Prisma.$CustomerPayload<ExtArgs>
        fields: Prisma.CustomerFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CustomerFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CustomerFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload>
          }
          findFirst: {
            args: Prisma.CustomerFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CustomerFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload>
          }
          findMany: {
            args: Prisma.CustomerFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload>[]
          }
          create: {
            args: Prisma.CustomerCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload>
          }
          createMany: {
            args: Prisma.CustomerCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CustomerCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload>[]
          }
          delete: {
            args: Prisma.CustomerDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload>
          }
          update: {
            args: Prisma.CustomerUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload>
          }
          deleteMany: {
            args: Prisma.CustomerDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CustomerUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CustomerUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload>[]
          }
          upsert: {
            args: Prisma.CustomerUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload>
          }
          aggregate: {
            args: Prisma.CustomerAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCustomer>
          }
          groupBy: {
            args: Prisma.CustomerGroupByArgs<ExtArgs>
            result: $Utils.Optional<CustomerGroupByOutputType>[]
          }
          count: {
            args: Prisma.CustomerCountArgs<ExtArgs>
            result: $Utils.Optional<CustomerCountAggregateOutputType> | number
          }
        }
      }
      DeliveryAddress: {
        payload: Prisma.$DeliveryAddressPayload<ExtArgs>
        fields: Prisma.DeliveryAddressFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DeliveryAddressFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeliveryAddressPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DeliveryAddressFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeliveryAddressPayload>
          }
          findFirst: {
            args: Prisma.DeliveryAddressFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeliveryAddressPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DeliveryAddressFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeliveryAddressPayload>
          }
          findMany: {
            args: Prisma.DeliveryAddressFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeliveryAddressPayload>[]
          }
          create: {
            args: Prisma.DeliveryAddressCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeliveryAddressPayload>
          }
          createMany: {
            args: Prisma.DeliveryAddressCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DeliveryAddressCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeliveryAddressPayload>[]
          }
          delete: {
            args: Prisma.DeliveryAddressDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeliveryAddressPayload>
          }
          update: {
            args: Prisma.DeliveryAddressUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeliveryAddressPayload>
          }
          deleteMany: {
            args: Prisma.DeliveryAddressDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DeliveryAddressUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.DeliveryAddressUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeliveryAddressPayload>[]
          }
          upsert: {
            args: Prisma.DeliveryAddressUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DeliveryAddressPayload>
          }
          aggregate: {
            args: Prisma.DeliveryAddressAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDeliveryAddress>
          }
          groupBy: {
            args: Prisma.DeliveryAddressGroupByArgs<ExtArgs>
            result: $Utils.Optional<DeliveryAddressGroupByOutputType>[]
          }
          count: {
            args: Prisma.DeliveryAddressCountArgs<ExtArgs>
            result: $Utils.Optional<DeliveryAddressCountAggregateOutputType> | number
          }
        }
      }
      Message: {
        payload: Prisma.$MessagePayload<ExtArgs>
        fields: Prisma.MessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          findFirst: {
            args: Prisma.MessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          findMany: {
            args: Prisma.MessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          create: {
            args: Prisma.MessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          createMany: {
            args: Prisma.MessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          delete: {
            args: Prisma.MessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          update: {
            args: Prisma.MessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          deleteMany: {
            args: Prisma.MessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MessageUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          upsert: {
            args: Prisma.MessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          aggregate: {
            args: Prisma.MessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMessage>
          }
          groupBy: {
            args: Prisma.MessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<MessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.MessageCountArgs<ExtArgs>
            result: $Utils.Optional<MessageCountAggregateOutputType> | number
          }
        }
      }
      PromotialMessage: {
        payload: Prisma.$PromotialMessagePayload<ExtArgs>
        fields: Prisma.PromotialMessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PromotialMessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromotialMessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PromotialMessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromotialMessagePayload>
          }
          findFirst: {
            args: Prisma.PromotialMessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromotialMessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PromotialMessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromotialMessagePayload>
          }
          findMany: {
            args: Prisma.PromotialMessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromotialMessagePayload>[]
          }
          create: {
            args: Prisma.PromotialMessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromotialMessagePayload>
          }
          createMany: {
            args: Prisma.PromotialMessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PromotialMessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromotialMessagePayload>[]
          }
          delete: {
            args: Prisma.PromotialMessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromotialMessagePayload>
          }
          update: {
            args: Prisma.PromotialMessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromotialMessagePayload>
          }
          deleteMany: {
            args: Prisma.PromotialMessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PromotialMessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PromotialMessageUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromotialMessagePayload>[]
          }
          upsert: {
            args: Prisma.PromotialMessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PromotialMessagePayload>
          }
          aggregate: {
            args: Prisma.PromotialMessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePromotialMessage>
          }
          groupBy: {
            args: Prisma.PromotialMessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<PromotialMessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.PromotialMessageCountArgs<ExtArgs>
            result: $Utils.Optional<PromotialMessageCountAggregateOutputType> | number
          }
        }
      }
      Order: {
        payload: Prisma.$OrderPayload<ExtArgs>
        fields: Prisma.OrderFieldRefs
        operations: {
          findUnique: {
            args: Prisma.OrderFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.OrderFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>
          }
          findFirst: {
            args: Prisma.OrderFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.OrderFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>
          }
          findMany: {
            args: Prisma.OrderFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>[]
          }
          create: {
            args: Prisma.OrderCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>
          }
          createMany: {
            args: Prisma.OrderCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.OrderCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>[]
          }
          delete: {
            args: Prisma.OrderDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>
          }
          update: {
            args: Prisma.OrderUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>
          }
          deleteMany: {
            args: Prisma.OrderDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.OrderUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.OrderUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>[]
          }
          upsert: {
            args: Prisma.OrderUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderPayload>
          }
          aggregate: {
            args: Prisma.OrderAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateOrder>
          }
          groupBy: {
            args: Prisma.OrderGroupByArgs<ExtArgs>
            result: $Utils.Optional<OrderGroupByOutputType>[]
          }
          count: {
            args: Prisma.OrderCountArgs<ExtArgs>
            result: $Utils.Optional<OrderCountAggregateOutputType> | number
          }
        }
      }
      OrderProducts: {
        payload: Prisma.$OrderProductsPayload<ExtArgs>
        fields: Prisma.OrderProductsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.OrderProductsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderProductsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.OrderProductsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderProductsPayload>
          }
          findFirst: {
            args: Prisma.OrderProductsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderProductsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.OrderProductsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderProductsPayload>
          }
          findMany: {
            args: Prisma.OrderProductsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderProductsPayload>[]
          }
          create: {
            args: Prisma.OrderProductsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderProductsPayload>
          }
          createMany: {
            args: Prisma.OrderProductsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.OrderProductsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderProductsPayload>[]
          }
          delete: {
            args: Prisma.OrderProductsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderProductsPayload>
          }
          update: {
            args: Prisma.OrderProductsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderProductsPayload>
          }
          deleteMany: {
            args: Prisma.OrderProductsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.OrderProductsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.OrderProductsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderProductsPayload>[]
          }
          upsert: {
            args: Prisma.OrderProductsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OrderProductsPayload>
          }
          aggregate: {
            args: Prisma.OrderProductsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateOrderProducts>
          }
          groupBy: {
            args: Prisma.OrderProductsGroupByArgs<ExtArgs>
            result: $Utils.Optional<OrderProductsGroupByOutputType>[]
          }
          count: {
            args: Prisma.OrderProductsCountArgs<ExtArgs>
            result: $Utils.Optional<OrderProductsCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    progressiveDiscount?: ProgressiveDiscountOmit
    progressiveDiscountStep?: ProgressiveDiscountStepOmit
    file?: FileOmit
    modifierGroup?: ModifierGroupOmit
    business?: BusinessOmit
    branch?: BranchOmit
    address?: AddressOmit
    product?: ProductOmit
    category?: CategoryOmit
    campaign?: CampaignOmit
    customer?: CustomerOmit
    deliveryAddress?: DeliveryAddressOmit
    message?: MessageOmit
    promotialMessage?: PromotialMessageOmit
    order?: OrderOmit
    orderProducts?: OrderProductsOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type ProgressiveDiscountCountOutputType
   */

  export type ProgressiveDiscountCountOutputType = {
    steps: number
  }

  export type ProgressiveDiscountCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    steps?: boolean | ProgressiveDiscountCountOutputTypeCountStepsArgs
  }

  // Custom InputTypes
  /**
   * ProgressiveDiscountCountOutputType without action
   */
  export type ProgressiveDiscountCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscountCountOutputType
     */
    select?: ProgressiveDiscountCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ProgressiveDiscountCountOutputType without action
   */
  export type ProgressiveDiscountCountOutputTypeCountStepsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProgressiveDiscountStepWhereInput
  }


  /**
   * Count Type BusinessCountOutputType
   */

  export type BusinessCountOutputType = {
    branches: number
  }

  export type BusinessCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    branches?: boolean | BusinessCountOutputTypeCountBranchesArgs
  }

  // Custom InputTypes
  /**
   * BusinessCountOutputType without action
   */
  export type BusinessCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BusinessCountOutputType
     */
    select?: BusinessCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * BusinessCountOutputType without action
   */
  export type BusinessCountOutputTypeCountBranchesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BranchWhereInput
  }


  /**
   * Count Type AddressCountOutputType
   */

  export type AddressCountOutputType = {
    orders: number
  }

  export type AddressCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    orders?: boolean | AddressCountOutputTypeCountOrdersArgs
  }

  // Custom InputTypes
  /**
   * AddressCountOutputType without action
   */
  export type AddressCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AddressCountOutputType
     */
    select?: AddressCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * AddressCountOutputType without action
   */
  export type AddressCountOutputTypeCountOrdersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OrderWhereInput
  }


  /**
   * Count Type ProductCountOutputType
   */

  export type ProductCountOutputType = {
    photos: number
    modifierGroups: number
    OrderProducts: number
  }

  export type ProductCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    photos?: boolean | ProductCountOutputTypeCountPhotosArgs
    modifierGroups?: boolean | ProductCountOutputTypeCountModifierGroupsArgs
    OrderProducts?: boolean | ProductCountOutputTypeCountOrderProductsArgs
  }

  // Custom InputTypes
  /**
   * ProductCountOutputType without action
   */
  export type ProductCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductCountOutputType
     */
    select?: ProductCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ProductCountOutputType without action
   */
  export type ProductCountOutputTypeCountPhotosArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FileWhereInput
  }

  /**
   * ProductCountOutputType without action
   */
  export type ProductCountOutputTypeCountModifierGroupsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ModifierGroupWhereInput
  }

  /**
   * ProductCountOutputType without action
   */
  export type ProductCountOutputTypeCountOrderProductsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OrderProductsWhereInput
  }


  /**
   * Count Type CategoryCountOutputType
   */

  export type CategoryCountOutputType = {
    products: number
  }

  export type CategoryCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    products?: boolean | CategoryCountOutputTypeCountProductsArgs
  }

  // Custom InputTypes
  /**
   * CategoryCountOutputType without action
   */
  export type CategoryCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryCountOutputType
     */
    select?: CategoryCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CategoryCountOutputType without action
   */
  export type CategoryCountOutputTypeCountProductsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProductWhereInput
  }


  /**
   * Count Type CampaignCountOutputType
   */

  export type CampaignCountOutputType = {
    promotialMessages: number
  }

  export type CampaignCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    promotialMessages?: boolean | CampaignCountOutputTypeCountPromotialMessagesArgs
  }

  // Custom InputTypes
  /**
   * CampaignCountOutputType without action
   */
  export type CampaignCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CampaignCountOutputType
     */
    select?: CampaignCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CampaignCountOutputType without action
   */
  export type CampaignCountOutputTypeCountPromotialMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PromotialMessageWhereInput
  }


  /**
   * Count Type CustomerCountOutputType
   */

  export type CustomerCountOutputType = {
    orders: number
    promotionalMessages: number
    addresses: number
  }

  export type CustomerCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    orders?: boolean | CustomerCountOutputTypeCountOrdersArgs
    promotionalMessages?: boolean | CustomerCountOutputTypeCountPromotionalMessagesArgs
    addresses?: boolean | CustomerCountOutputTypeCountAddressesArgs
  }

  // Custom InputTypes
  /**
   * CustomerCountOutputType without action
   */
  export type CustomerCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerCountOutputType
     */
    select?: CustomerCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CustomerCountOutputType without action
   */
  export type CustomerCountOutputTypeCountOrdersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OrderWhereInput
  }

  /**
   * CustomerCountOutputType without action
   */
  export type CustomerCountOutputTypeCountPromotionalMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PromotialMessageWhereInput
  }

  /**
   * CustomerCountOutputType without action
   */
  export type CustomerCountOutputTypeCountAddressesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DeliveryAddressWhereInput
  }


  /**
   * Count Type MessageCountOutputType
   */

  export type MessageCountOutputType = {
    promotialMessages: number
  }

  export type MessageCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    promotialMessages?: boolean | MessageCountOutputTypeCountPromotialMessagesArgs
  }

  // Custom InputTypes
  /**
   * MessageCountOutputType without action
   */
  export type MessageCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageCountOutputType
     */
    select?: MessageCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * MessageCountOutputType without action
   */
  export type MessageCountOutputTypeCountPromotialMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PromotialMessageWhereInput
  }


  /**
   * Count Type OrderCountOutputType
   */

  export type OrderCountOutputType = {
    orderProducts: number
  }

  export type OrderCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    orderProducts?: boolean | OrderCountOutputTypeCountOrderProductsArgs
  }

  // Custom InputTypes
  /**
   * OrderCountOutputType without action
   */
  export type OrderCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderCountOutputType
     */
    select?: OrderCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * OrderCountOutputType without action
   */
  export type OrderCountOutputTypeCountOrderProductsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OrderProductsWhereInput
  }


  /**
   * Models
   */

  /**
   * Model ProgressiveDiscount
   */

  export type AggregateProgressiveDiscount = {
    _count: ProgressiveDiscountCountAggregateOutputType | null
    _min: ProgressiveDiscountMinAggregateOutputType | null
    _max: ProgressiveDiscountMaxAggregateOutputType | null
  }

  export type ProgressiveDiscountMinAggregateOutputType = {
    id: string | null
    createdAt: Date | null
  }

  export type ProgressiveDiscountMaxAggregateOutputType = {
    id: string | null
    createdAt: Date | null
  }

  export type ProgressiveDiscountCountAggregateOutputType = {
    id: number
    createdAt: number
    _all: number
  }


  export type ProgressiveDiscountMinAggregateInputType = {
    id?: true
    createdAt?: true
  }

  export type ProgressiveDiscountMaxAggregateInputType = {
    id?: true
    createdAt?: true
  }

  export type ProgressiveDiscountCountAggregateInputType = {
    id?: true
    createdAt?: true
    _all?: true
  }

  export type ProgressiveDiscountAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProgressiveDiscount to aggregate.
     */
    where?: ProgressiveDiscountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProgressiveDiscounts to fetch.
     */
    orderBy?: ProgressiveDiscountOrderByWithRelationInput | ProgressiveDiscountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProgressiveDiscountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProgressiveDiscounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProgressiveDiscounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ProgressiveDiscounts
    **/
    _count?: true | ProgressiveDiscountCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProgressiveDiscountMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProgressiveDiscountMaxAggregateInputType
  }

  export type GetProgressiveDiscountAggregateType<T extends ProgressiveDiscountAggregateArgs> = {
        [P in keyof T & keyof AggregateProgressiveDiscount]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProgressiveDiscount[P]>
      : GetScalarType<T[P], AggregateProgressiveDiscount[P]>
  }




  export type ProgressiveDiscountGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProgressiveDiscountWhereInput
    orderBy?: ProgressiveDiscountOrderByWithAggregationInput | ProgressiveDiscountOrderByWithAggregationInput[]
    by: ProgressiveDiscountScalarFieldEnum[] | ProgressiveDiscountScalarFieldEnum
    having?: ProgressiveDiscountScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProgressiveDiscountCountAggregateInputType | true
    _min?: ProgressiveDiscountMinAggregateInputType
    _max?: ProgressiveDiscountMaxAggregateInputType
  }

  export type ProgressiveDiscountGroupByOutputType = {
    id: string
    createdAt: Date
    _count: ProgressiveDiscountCountAggregateOutputType | null
    _min: ProgressiveDiscountMinAggregateOutputType | null
    _max: ProgressiveDiscountMaxAggregateOutputType | null
  }

  type GetProgressiveDiscountGroupByPayload<T extends ProgressiveDiscountGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProgressiveDiscountGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProgressiveDiscountGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProgressiveDiscountGroupByOutputType[P]>
            : GetScalarType<T[P], ProgressiveDiscountGroupByOutputType[P]>
        }
      >
    >


  export type ProgressiveDiscountSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    steps?: boolean | ProgressiveDiscount$stepsArgs<ExtArgs>
    _count?: boolean | ProgressiveDiscountCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["progressiveDiscount"]>

  export type ProgressiveDiscountSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["progressiveDiscount"]>

  export type ProgressiveDiscountSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["progressiveDiscount"]>

  export type ProgressiveDiscountSelectScalar = {
    id?: boolean
    createdAt?: boolean
  }

  export type ProgressiveDiscountOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt", ExtArgs["result"]["progressiveDiscount"]>
  export type ProgressiveDiscountInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    steps?: boolean | ProgressiveDiscount$stepsArgs<ExtArgs>
    _count?: boolean | ProgressiveDiscountCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ProgressiveDiscountIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type ProgressiveDiscountIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ProgressiveDiscountPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ProgressiveDiscount"
    objects: {
      steps: Prisma.$ProgressiveDiscountStepPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      createdAt: Date
    }, ExtArgs["result"]["progressiveDiscount"]>
    composites: {}
  }

  type ProgressiveDiscountGetPayload<S extends boolean | null | undefined | ProgressiveDiscountDefaultArgs> = $Result.GetResult<Prisma.$ProgressiveDiscountPayload, S>

  type ProgressiveDiscountCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ProgressiveDiscountFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ProgressiveDiscountCountAggregateInputType | true
    }

  export interface ProgressiveDiscountDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ProgressiveDiscount'], meta: { name: 'ProgressiveDiscount' } }
    /**
     * Find zero or one ProgressiveDiscount that matches the filter.
     * @param {ProgressiveDiscountFindUniqueArgs} args - Arguments to find a ProgressiveDiscount
     * @example
     * // Get one ProgressiveDiscount
     * const progressiveDiscount = await prisma.progressiveDiscount.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProgressiveDiscountFindUniqueArgs>(args: SelectSubset<T, ProgressiveDiscountFindUniqueArgs<ExtArgs>>): Prisma__ProgressiveDiscountClient<$Result.GetResult<Prisma.$ProgressiveDiscountPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ProgressiveDiscount that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProgressiveDiscountFindUniqueOrThrowArgs} args - Arguments to find a ProgressiveDiscount
     * @example
     * // Get one ProgressiveDiscount
     * const progressiveDiscount = await prisma.progressiveDiscount.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProgressiveDiscountFindUniqueOrThrowArgs>(args: SelectSubset<T, ProgressiveDiscountFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProgressiveDiscountClient<$Result.GetResult<Prisma.$ProgressiveDiscountPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ProgressiveDiscount that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProgressiveDiscountFindFirstArgs} args - Arguments to find a ProgressiveDiscount
     * @example
     * // Get one ProgressiveDiscount
     * const progressiveDiscount = await prisma.progressiveDiscount.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProgressiveDiscountFindFirstArgs>(args?: SelectSubset<T, ProgressiveDiscountFindFirstArgs<ExtArgs>>): Prisma__ProgressiveDiscountClient<$Result.GetResult<Prisma.$ProgressiveDiscountPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ProgressiveDiscount that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProgressiveDiscountFindFirstOrThrowArgs} args - Arguments to find a ProgressiveDiscount
     * @example
     * // Get one ProgressiveDiscount
     * const progressiveDiscount = await prisma.progressiveDiscount.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProgressiveDiscountFindFirstOrThrowArgs>(args?: SelectSubset<T, ProgressiveDiscountFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProgressiveDiscountClient<$Result.GetResult<Prisma.$ProgressiveDiscountPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ProgressiveDiscounts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProgressiveDiscountFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ProgressiveDiscounts
     * const progressiveDiscounts = await prisma.progressiveDiscount.findMany()
     * 
     * // Get first 10 ProgressiveDiscounts
     * const progressiveDiscounts = await prisma.progressiveDiscount.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const progressiveDiscountWithIdOnly = await prisma.progressiveDiscount.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProgressiveDiscountFindManyArgs>(args?: SelectSubset<T, ProgressiveDiscountFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProgressiveDiscountPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ProgressiveDiscount.
     * @param {ProgressiveDiscountCreateArgs} args - Arguments to create a ProgressiveDiscount.
     * @example
     * // Create one ProgressiveDiscount
     * const ProgressiveDiscount = await prisma.progressiveDiscount.create({
     *   data: {
     *     // ... data to create a ProgressiveDiscount
     *   }
     * })
     * 
     */
    create<T extends ProgressiveDiscountCreateArgs>(args: SelectSubset<T, ProgressiveDiscountCreateArgs<ExtArgs>>): Prisma__ProgressiveDiscountClient<$Result.GetResult<Prisma.$ProgressiveDiscountPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ProgressiveDiscounts.
     * @param {ProgressiveDiscountCreateManyArgs} args - Arguments to create many ProgressiveDiscounts.
     * @example
     * // Create many ProgressiveDiscounts
     * const progressiveDiscount = await prisma.progressiveDiscount.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProgressiveDiscountCreateManyArgs>(args?: SelectSubset<T, ProgressiveDiscountCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ProgressiveDiscounts and returns the data saved in the database.
     * @param {ProgressiveDiscountCreateManyAndReturnArgs} args - Arguments to create many ProgressiveDiscounts.
     * @example
     * // Create many ProgressiveDiscounts
     * const progressiveDiscount = await prisma.progressiveDiscount.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ProgressiveDiscounts and only return the `id`
     * const progressiveDiscountWithIdOnly = await prisma.progressiveDiscount.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProgressiveDiscountCreateManyAndReturnArgs>(args?: SelectSubset<T, ProgressiveDiscountCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProgressiveDiscountPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ProgressiveDiscount.
     * @param {ProgressiveDiscountDeleteArgs} args - Arguments to delete one ProgressiveDiscount.
     * @example
     * // Delete one ProgressiveDiscount
     * const ProgressiveDiscount = await prisma.progressiveDiscount.delete({
     *   where: {
     *     // ... filter to delete one ProgressiveDiscount
     *   }
     * })
     * 
     */
    delete<T extends ProgressiveDiscountDeleteArgs>(args: SelectSubset<T, ProgressiveDiscountDeleteArgs<ExtArgs>>): Prisma__ProgressiveDiscountClient<$Result.GetResult<Prisma.$ProgressiveDiscountPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ProgressiveDiscount.
     * @param {ProgressiveDiscountUpdateArgs} args - Arguments to update one ProgressiveDiscount.
     * @example
     * // Update one ProgressiveDiscount
     * const progressiveDiscount = await prisma.progressiveDiscount.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProgressiveDiscountUpdateArgs>(args: SelectSubset<T, ProgressiveDiscountUpdateArgs<ExtArgs>>): Prisma__ProgressiveDiscountClient<$Result.GetResult<Prisma.$ProgressiveDiscountPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ProgressiveDiscounts.
     * @param {ProgressiveDiscountDeleteManyArgs} args - Arguments to filter ProgressiveDiscounts to delete.
     * @example
     * // Delete a few ProgressiveDiscounts
     * const { count } = await prisma.progressiveDiscount.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProgressiveDiscountDeleteManyArgs>(args?: SelectSubset<T, ProgressiveDiscountDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProgressiveDiscounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProgressiveDiscountUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ProgressiveDiscounts
     * const progressiveDiscount = await prisma.progressiveDiscount.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProgressiveDiscountUpdateManyArgs>(args: SelectSubset<T, ProgressiveDiscountUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProgressiveDiscounts and returns the data updated in the database.
     * @param {ProgressiveDiscountUpdateManyAndReturnArgs} args - Arguments to update many ProgressiveDiscounts.
     * @example
     * // Update many ProgressiveDiscounts
     * const progressiveDiscount = await prisma.progressiveDiscount.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ProgressiveDiscounts and only return the `id`
     * const progressiveDiscountWithIdOnly = await prisma.progressiveDiscount.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ProgressiveDiscountUpdateManyAndReturnArgs>(args: SelectSubset<T, ProgressiveDiscountUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProgressiveDiscountPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ProgressiveDiscount.
     * @param {ProgressiveDiscountUpsertArgs} args - Arguments to update or create a ProgressiveDiscount.
     * @example
     * // Update or create a ProgressiveDiscount
     * const progressiveDiscount = await prisma.progressiveDiscount.upsert({
     *   create: {
     *     // ... data to create a ProgressiveDiscount
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ProgressiveDiscount we want to update
     *   }
     * })
     */
    upsert<T extends ProgressiveDiscountUpsertArgs>(args: SelectSubset<T, ProgressiveDiscountUpsertArgs<ExtArgs>>): Prisma__ProgressiveDiscountClient<$Result.GetResult<Prisma.$ProgressiveDiscountPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ProgressiveDiscounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProgressiveDiscountCountArgs} args - Arguments to filter ProgressiveDiscounts to count.
     * @example
     * // Count the number of ProgressiveDiscounts
     * const count = await prisma.progressiveDiscount.count({
     *   where: {
     *     // ... the filter for the ProgressiveDiscounts we want to count
     *   }
     * })
    **/
    count<T extends ProgressiveDiscountCountArgs>(
      args?: Subset<T, ProgressiveDiscountCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProgressiveDiscountCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ProgressiveDiscount.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProgressiveDiscountAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProgressiveDiscountAggregateArgs>(args: Subset<T, ProgressiveDiscountAggregateArgs>): Prisma.PrismaPromise<GetProgressiveDiscountAggregateType<T>>

    /**
     * Group by ProgressiveDiscount.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProgressiveDiscountGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProgressiveDiscountGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProgressiveDiscountGroupByArgs['orderBy'] }
        : { orderBy?: ProgressiveDiscountGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProgressiveDiscountGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProgressiveDiscountGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ProgressiveDiscount model
   */
  readonly fields: ProgressiveDiscountFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ProgressiveDiscount.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProgressiveDiscountClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    steps<T extends ProgressiveDiscount$stepsArgs<ExtArgs> = {}>(args?: Subset<T, ProgressiveDiscount$stepsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProgressiveDiscountStepPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ProgressiveDiscount model
   */
  interface ProgressiveDiscountFieldRefs {
    readonly id: FieldRef<"ProgressiveDiscount", 'String'>
    readonly createdAt: FieldRef<"ProgressiveDiscount", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ProgressiveDiscount findUnique
   */
  export type ProgressiveDiscountFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscount
     */
    select?: ProgressiveDiscountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscount
     */
    omit?: ProgressiveDiscountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountInclude<ExtArgs> | null
    /**
     * Filter, which ProgressiveDiscount to fetch.
     */
    where: ProgressiveDiscountWhereUniqueInput
  }

  /**
   * ProgressiveDiscount findUniqueOrThrow
   */
  export type ProgressiveDiscountFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscount
     */
    select?: ProgressiveDiscountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscount
     */
    omit?: ProgressiveDiscountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountInclude<ExtArgs> | null
    /**
     * Filter, which ProgressiveDiscount to fetch.
     */
    where: ProgressiveDiscountWhereUniqueInput
  }

  /**
   * ProgressiveDiscount findFirst
   */
  export type ProgressiveDiscountFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscount
     */
    select?: ProgressiveDiscountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscount
     */
    omit?: ProgressiveDiscountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountInclude<ExtArgs> | null
    /**
     * Filter, which ProgressiveDiscount to fetch.
     */
    where?: ProgressiveDiscountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProgressiveDiscounts to fetch.
     */
    orderBy?: ProgressiveDiscountOrderByWithRelationInput | ProgressiveDiscountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProgressiveDiscounts.
     */
    cursor?: ProgressiveDiscountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProgressiveDiscounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProgressiveDiscounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProgressiveDiscounts.
     */
    distinct?: ProgressiveDiscountScalarFieldEnum | ProgressiveDiscountScalarFieldEnum[]
  }

  /**
   * ProgressiveDiscount findFirstOrThrow
   */
  export type ProgressiveDiscountFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscount
     */
    select?: ProgressiveDiscountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscount
     */
    omit?: ProgressiveDiscountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountInclude<ExtArgs> | null
    /**
     * Filter, which ProgressiveDiscount to fetch.
     */
    where?: ProgressiveDiscountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProgressiveDiscounts to fetch.
     */
    orderBy?: ProgressiveDiscountOrderByWithRelationInput | ProgressiveDiscountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProgressiveDiscounts.
     */
    cursor?: ProgressiveDiscountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProgressiveDiscounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProgressiveDiscounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProgressiveDiscounts.
     */
    distinct?: ProgressiveDiscountScalarFieldEnum | ProgressiveDiscountScalarFieldEnum[]
  }

  /**
   * ProgressiveDiscount findMany
   */
  export type ProgressiveDiscountFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscount
     */
    select?: ProgressiveDiscountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscount
     */
    omit?: ProgressiveDiscountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountInclude<ExtArgs> | null
    /**
     * Filter, which ProgressiveDiscounts to fetch.
     */
    where?: ProgressiveDiscountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProgressiveDiscounts to fetch.
     */
    orderBy?: ProgressiveDiscountOrderByWithRelationInput | ProgressiveDiscountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ProgressiveDiscounts.
     */
    cursor?: ProgressiveDiscountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProgressiveDiscounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProgressiveDiscounts.
     */
    skip?: number
    distinct?: ProgressiveDiscountScalarFieldEnum | ProgressiveDiscountScalarFieldEnum[]
  }

  /**
   * ProgressiveDiscount create
   */
  export type ProgressiveDiscountCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscount
     */
    select?: ProgressiveDiscountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscount
     */
    omit?: ProgressiveDiscountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountInclude<ExtArgs> | null
    /**
     * The data needed to create a ProgressiveDiscount.
     */
    data: XOR<ProgressiveDiscountCreateInput, ProgressiveDiscountUncheckedCreateInput>
  }

  /**
   * ProgressiveDiscount createMany
   */
  export type ProgressiveDiscountCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ProgressiveDiscounts.
     */
    data: ProgressiveDiscountCreateManyInput | ProgressiveDiscountCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ProgressiveDiscount createManyAndReturn
   */
  export type ProgressiveDiscountCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscount
     */
    select?: ProgressiveDiscountSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscount
     */
    omit?: ProgressiveDiscountOmit<ExtArgs> | null
    /**
     * The data used to create many ProgressiveDiscounts.
     */
    data: ProgressiveDiscountCreateManyInput | ProgressiveDiscountCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ProgressiveDiscount update
   */
  export type ProgressiveDiscountUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscount
     */
    select?: ProgressiveDiscountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscount
     */
    omit?: ProgressiveDiscountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountInclude<ExtArgs> | null
    /**
     * The data needed to update a ProgressiveDiscount.
     */
    data: XOR<ProgressiveDiscountUpdateInput, ProgressiveDiscountUncheckedUpdateInput>
    /**
     * Choose, which ProgressiveDiscount to update.
     */
    where: ProgressiveDiscountWhereUniqueInput
  }

  /**
   * ProgressiveDiscount updateMany
   */
  export type ProgressiveDiscountUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ProgressiveDiscounts.
     */
    data: XOR<ProgressiveDiscountUpdateManyMutationInput, ProgressiveDiscountUncheckedUpdateManyInput>
    /**
     * Filter which ProgressiveDiscounts to update
     */
    where?: ProgressiveDiscountWhereInput
    /**
     * Limit how many ProgressiveDiscounts to update.
     */
    limit?: number
  }

  /**
   * ProgressiveDiscount updateManyAndReturn
   */
  export type ProgressiveDiscountUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscount
     */
    select?: ProgressiveDiscountSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscount
     */
    omit?: ProgressiveDiscountOmit<ExtArgs> | null
    /**
     * The data used to update ProgressiveDiscounts.
     */
    data: XOR<ProgressiveDiscountUpdateManyMutationInput, ProgressiveDiscountUncheckedUpdateManyInput>
    /**
     * Filter which ProgressiveDiscounts to update
     */
    where?: ProgressiveDiscountWhereInput
    /**
     * Limit how many ProgressiveDiscounts to update.
     */
    limit?: number
  }

  /**
   * ProgressiveDiscount upsert
   */
  export type ProgressiveDiscountUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscount
     */
    select?: ProgressiveDiscountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscount
     */
    omit?: ProgressiveDiscountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountInclude<ExtArgs> | null
    /**
     * The filter to search for the ProgressiveDiscount to update in case it exists.
     */
    where: ProgressiveDiscountWhereUniqueInput
    /**
     * In case the ProgressiveDiscount found by the `where` argument doesn't exist, create a new ProgressiveDiscount with this data.
     */
    create: XOR<ProgressiveDiscountCreateInput, ProgressiveDiscountUncheckedCreateInput>
    /**
     * In case the ProgressiveDiscount was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProgressiveDiscountUpdateInput, ProgressiveDiscountUncheckedUpdateInput>
  }

  /**
   * ProgressiveDiscount delete
   */
  export type ProgressiveDiscountDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscount
     */
    select?: ProgressiveDiscountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscount
     */
    omit?: ProgressiveDiscountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountInclude<ExtArgs> | null
    /**
     * Filter which ProgressiveDiscount to delete.
     */
    where: ProgressiveDiscountWhereUniqueInput
  }

  /**
   * ProgressiveDiscount deleteMany
   */
  export type ProgressiveDiscountDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProgressiveDiscounts to delete
     */
    where?: ProgressiveDiscountWhereInput
    /**
     * Limit how many ProgressiveDiscounts to delete.
     */
    limit?: number
  }

  /**
   * ProgressiveDiscount.steps
   */
  export type ProgressiveDiscount$stepsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscountStep
     */
    select?: ProgressiveDiscountStepSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscountStep
     */
    omit?: ProgressiveDiscountStepOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountStepInclude<ExtArgs> | null
    where?: ProgressiveDiscountStepWhereInput
    orderBy?: ProgressiveDiscountStepOrderByWithRelationInput | ProgressiveDiscountStepOrderByWithRelationInput[]
    cursor?: ProgressiveDiscountStepWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ProgressiveDiscountStepScalarFieldEnum | ProgressiveDiscountStepScalarFieldEnum[]
  }

  /**
   * ProgressiveDiscount without action
   */
  export type ProgressiveDiscountDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscount
     */
    select?: ProgressiveDiscountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscount
     */
    omit?: ProgressiveDiscountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountInclude<ExtArgs> | null
  }


  /**
   * Model ProgressiveDiscountStep
   */

  export type AggregateProgressiveDiscountStep = {
    _count: ProgressiveDiscountStepCountAggregateOutputType | null
    _avg: ProgressiveDiscountStepAvgAggregateOutputType | null
    _sum: ProgressiveDiscountStepSumAggregateOutputType | null
    _min: ProgressiveDiscountStepMinAggregateOutputType | null
    _max: ProgressiveDiscountStepMaxAggregateOutputType | null
  }

  export type ProgressiveDiscountStepAvgAggregateOutputType = {
    amount: number | null
    discount: number | null
  }

  export type ProgressiveDiscountStepSumAggregateOutputType = {
    amount: number | null
    discount: number | null
  }

  export type ProgressiveDiscountStepMinAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    amount: number | null
    discount: number | null
    discountType: $Enums.ProgressiveDiscountStepType | null
    progressiveDiscountId: string | null
  }

  export type ProgressiveDiscountStepMaxAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    amount: number | null
    discount: number | null
    discountType: $Enums.ProgressiveDiscountStepType | null
    progressiveDiscountId: string | null
  }

  export type ProgressiveDiscountStepCountAggregateOutputType = {
    id: number
    createdAt: number
    amount: number
    discount: number
    discountType: number
    progressiveDiscountId: number
    _all: number
  }


  export type ProgressiveDiscountStepAvgAggregateInputType = {
    amount?: true
    discount?: true
  }

  export type ProgressiveDiscountStepSumAggregateInputType = {
    amount?: true
    discount?: true
  }

  export type ProgressiveDiscountStepMinAggregateInputType = {
    id?: true
    createdAt?: true
    amount?: true
    discount?: true
    discountType?: true
    progressiveDiscountId?: true
  }

  export type ProgressiveDiscountStepMaxAggregateInputType = {
    id?: true
    createdAt?: true
    amount?: true
    discount?: true
    discountType?: true
    progressiveDiscountId?: true
  }

  export type ProgressiveDiscountStepCountAggregateInputType = {
    id?: true
    createdAt?: true
    amount?: true
    discount?: true
    discountType?: true
    progressiveDiscountId?: true
    _all?: true
  }

  export type ProgressiveDiscountStepAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProgressiveDiscountStep to aggregate.
     */
    where?: ProgressiveDiscountStepWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProgressiveDiscountSteps to fetch.
     */
    orderBy?: ProgressiveDiscountStepOrderByWithRelationInput | ProgressiveDiscountStepOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProgressiveDiscountStepWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProgressiveDiscountSteps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProgressiveDiscountSteps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ProgressiveDiscountSteps
    **/
    _count?: true | ProgressiveDiscountStepCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ProgressiveDiscountStepAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ProgressiveDiscountStepSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProgressiveDiscountStepMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProgressiveDiscountStepMaxAggregateInputType
  }

  export type GetProgressiveDiscountStepAggregateType<T extends ProgressiveDiscountStepAggregateArgs> = {
        [P in keyof T & keyof AggregateProgressiveDiscountStep]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProgressiveDiscountStep[P]>
      : GetScalarType<T[P], AggregateProgressiveDiscountStep[P]>
  }




  export type ProgressiveDiscountStepGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProgressiveDiscountStepWhereInput
    orderBy?: ProgressiveDiscountStepOrderByWithAggregationInput | ProgressiveDiscountStepOrderByWithAggregationInput[]
    by: ProgressiveDiscountStepScalarFieldEnum[] | ProgressiveDiscountStepScalarFieldEnum
    having?: ProgressiveDiscountStepScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProgressiveDiscountStepCountAggregateInputType | true
    _avg?: ProgressiveDiscountStepAvgAggregateInputType
    _sum?: ProgressiveDiscountStepSumAggregateInputType
    _min?: ProgressiveDiscountStepMinAggregateInputType
    _max?: ProgressiveDiscountStepMaxAggregateInputType
  }

  export type ProgressiveDiscountStepGroupByOutputType = {
    id: string
    createdAt: Date
    amount: number
    discount: number | null
    discountType: $Enums.ProgressiveDiscountStepType
    progressiveDiscountId: string
    _count: ProgressiveDiscountStepCountAggregateOutputType | null
    _avg: ProgressiveDiscountStepAvgAggregateOutputType | null
    _sum: ProgressiveDiscountStepSumAggregateOutputType | null
    _min: ProgressiveDiscountStepMinAggregateOutputType | null
    _max: ProgressiveDiscountStepMaxAggregateOutputType | null
  }

  type GetProgressiveDiscountStepGroupByPayload<T extends ProgressiveDiscountStepGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProgressiveDiscountStepGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProgressiveDiscountStepGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProgressiveDiscountStepGroupByOutputType[P]>
            : GetScalarType<T[P], ProgressiveDiscountStepGroupByOutputType[P]>
        }
      >
    >


  export type ProgressiveDiscountStepSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    amount?: boolean
    discount?: boolean
    discountType?: boolean
    progressiveDiscountId?: boolean
    progressiveDiscount?: boolean | ProgressiveDiscountDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["progressiveDiscountStep"]>

  export type ProgressiveDiscountStepSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    amount?: boolean
    discount?: boolean
    discountType?: boolean
    progressiveDiscountId?: boolean
    progressiveDiscount?: boolean | ProgressiveDiscountDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["progressiveDiscountStep"]>

  export type ProgressiveDiscountStepSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    amount?: boolean
    discount?: boolean
    discountType?: boolean
    progressiveDiscountId?: boolean
    progressiveDiscount?: boolean | ProgressiveDiscountDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["progressiveDiscountStep"]>

  export type ProgressiveDiscountStepSelectScalar = {
    id?: boolean
    createdAt?: boolean
    amount?: boolean
    discount?: boolean
    discountType?: boolean
    progressiveDiscountId?: boolean
  }

  export type ProgressiveDiscountStepOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "amount" | "discount" | "discountType" | "progressiveDiscountId", ExtArgs["result"]["progressiveDiscountStep"]>
  export type ProgressiveDiscountStepInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    progressiveDiscount?: boolean | ProgressiveDiscountDefaultArgs<ExtArgs>
  }
  export type ProgressiveDiscountStepIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    progressiveDiscount?: boolean | ProgressiveDiscountDefaultArgs<ExtArgs>
  }
  export type ProgressiveDiscountStepIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    progressiveDiscount?: boolean | ProgressiveDiscountDefaultArgs<ExtArgs>
  }

  export type $ProgressiveDiscountStepPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ProgressiveDiscountStep"
    objects: {
      progressiveDiscount: Prisma.$ProgressiveDiscountPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      createdAt: Date
      amount: number
      discount: number | null
      discountType: $Enums.ProgressiveDiscountStepType
      progressiveDiscountId: string
    }, ExtArgs["result"]["progressiveDiscountStep"]>
    composites: {}
  }

  type ProgressiveDiscountStepGetPayload<S extends boolean | null | undefined | ProgressiveDiscountStepDefaultArgs> = $Result.GetResult<Prisma.$ProgressiveDiscountStepPayload, S>

  type ProgressiveDiscountStepCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ProgressiveDiscountStepFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ProgressiveDiscountStepCountAggregateInputType | true
    }

  export interface ProgressiveDiscountStepDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ProgressiveDiscountStep'], meta: { name: 'ProgressiveDiscountStep' } }
    /**
     * Find zero or one ProgressiveDiscountStep that matches the filter.
     * @param {ProgressiveDiscountStepFindUniqueArgs} args - Arguments to find a ProgressiveDiscountStep
     * @example
     * // Get one ProgressiveDiscountStep
     * const progressiveDiscountStep = await prisma.progressiveDiscountStep.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProgressiveDiscountStepFindUniqueArgs>(args: SelectSubset<T, ProgressiveDiscountStepFindUniqueArgs<ExtArgs>>): Prisma__ProgressiveDiscountStepClient<$Result.GetResult<Prisma.$ProgressiveDiscountStepPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ProgressiveDiscountStep that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProgressiveDiscountStepFindUniqueOrThrowArgs} args - Arguments to find a ProgressiveDiscountStep
     * @example
     * // Get one ProgressiveDiscountStep
     * const progressiveDiscountStep = await prisma.progressiveDiscountStep.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProgressiveDiscountStepFindUniqueOrThrowArgs>(args: SelectSubset<T, ProgressiveDiscountStepFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProgressiveDiscountStepClient<$Result.GetResult<Prisma.$ProgressiveDiscountStepPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ProgressiveDiscountStep that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProgressiveDiscountStepFindFirstArgs} args - Arguments to find a ProgressiveDiscountStep
     * @example
     * // Get one ProgressiveDiscountStep
     * const progressiveDiscountStep = await prisma.progressiveDiscountStep.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProgressiveDiscountStepFindFirstArgs>(args?: SelectSubset<T, ProgressiveDiscountStepFindFirstArgs<ExtArgs>>): Prisma__ProgressiveDiscountStepClient<$Result.GetResult<Prisma.$ProgressiveDiscountStepPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ProgressiveDiscountStep that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProgressiveDiscountStepFindFirstOrThrowArgs} args - Arguments to find a ProgressiveDiscountStep
     * @example
     * // Get one ProgressiveDiscountStep
     * const progressiveDiscountStep = await prisma.progressiveDiscountStep.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProgressiveDiscountStepFindFirstOrThrowArgs>(args?: SelectSubset<T, ProgressiveDiscountStepFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProgressiveDiscountStepClient<$Result.GetResult<Prisma.$ProgressiveDiscountStepPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ProgressiveDiscountSteps that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProgressiveDiscountStepFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ProgressiveDiscountSteps
     * const progressiveDiscountSteps = await prisma.progressiveDiscountStep.findMany()
     * 
     * // Get first 10 ProgressiveDiscountSteps
     * const progressiveDiscountSteps = await prisma.progressiveDiscountStep.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const progressiveDiscountStepWithIdOnly = await prisma.progressiveDiscountStep.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProgressiveDiscountStepFindManyArgs>(args?: SelectSubset<T, ProgressiveDiscountStepFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProgressiveDiscountStepPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ProgressiveDiscountStep.
     * @param {ProgressiveDiscountStepCreateArgs} args - Arguments to create a ProgressiveDiscountStep.
     * @example
     * // Create one ProgressiveDiscountStep
     * const ProgressiveDiscountStep = await prisma.progressiveDiscountStep.create({
     *   data: {
     *     // ... data to create a ProgressiveDiscountStep
     *   }
     * })
     * 
     */
    create<T extends ProgressiveDiscountStepCreateArgs>(args: SelectSubset<T, ProgressiveDiscountStepCreateArgs<ExtArgs>>): Prisma__ProgressiveDiscountStepClient<$Result.GetResult<Prisma.$ProgressiveDiscountStepPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ProgressiveDiscountSteps.
     * @param {ProgressiveDiscountStepCreateManyArgs} args - Arguments to create many ProgressiveDiscountSteps.
     * @example
     * // Create many ProgressiveDiscountSteps
     * const progressiveDiscountStep = await prisma.progressiveDiscountStep.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProgressiveDiscountStepCreateManyArgs>(args?: SelectSubset<T, ProgressiveDiscountStepCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ProgressiveDiscountSteps and returns the data saved in the database.
     * @param {ProgressiveDiscountStepCreateManyAndReturnArgs} args - Arguments to create many ProgressiveDiscountSteps.
     * @example
     * // Create many ProgressiveDiscountSteps
     * const progressiveDiscountStep = await prisma.progressiveDiscountStep.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ProgressiveDiscountSteps and only return the `id`
     * const progressiveDiscountStepWithIdOnly = await prisma.progressiveDiscountStep.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProgressiveDiscountStepCreateManyAndReturnArgs>(args?: SelectSubset<T, ProgressiveDiscountStepCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProgressiveDiscountStepPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ProgressiveDiscountStep.
     * @param {ProgressiveDiscountStepDeleteArgs} args - Arguments to delete one ProgressiveDiscountStep.
     * @example
     * // Delete one ProgressiveDiscountStep
     * const ProgressiveDiscountStep = await prisma.progressiveDiscountStep.delete({
     *   where: {
     *     // ... filter to delete one ProgressiveDiscountStep
     *   }
     * })
     * 
     */
    delete<T extends ProgressiveDiscountStepDeleteArgs>(args: SelectSubset<T, ProgressiveDiscountStepDeleteArgs<ExtArgs>>): Prisma__ProgressiveDiscountStepClient<$Result.GetResult<Prisma.$ProgressiveDiscountStepPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ProgressiveDiscountStep.
     * @param {ProgressiveDiscountStepUpdateArgs} args - Arguments to update one ProgressiveDiscountStep.
     * @example
     * // Update one ProgressiveDiscountStep
     * const progressiveDiscountStep = await prisma.progressiveDiscountStep.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProgressiveDiscountStepUpdateArgs>(args: SelectSubset<T, ProgressiveDiscountStepUpdateArgs<ExtArgs>>): Prisma__ProgressiveDiscountStepClient<$Result.GetResult<Prisma.$ProgressiveDiscountStepPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ProgressiveDiscountSteps.
     * @param {ProgressiveDiscountStepDeleteManyArgs} args - Arguments to filter ProgressiveDiscountSteps to delete.
     * @example
     * // Delete a few ProgressiveDiscountSteps
     * const { count } = await prisma.progressiveDiscountStep.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProgressiveDiscountStepDeleteManyArgs>(args?: SelectSubset<T, ProgressiveDiscountStepDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProgressiveDiscountSteps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProgressiveDiscountStepUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ProgressiveDiscountSteps
     * const progressiveDiscountStep = await prisma.progressiveDiscountStep.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProgressiveDiscountStepUpdateManyArgs>(args: SelectSubset<T, ProgressiveDiscountStepUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProgressiveDiscountSteps and returns the data updated in the database.
     * @param {ProgressiveDiscountStepUpdateManyAndReturnArgs} args - Arguments to update many ProgressiveDiscountSteps.
     * @example
     * // Update many ProgressiveDiscountSteps
     * const progressiveDiscountStep = await prisma.progressiveDiscountStep.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ProgressiveDiscountSteps and only return the `id`
     * const progressiveDiscountStepWithIdOnly = await prisma.progressiveDiscountStep.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ProgressiveDiscountStepUpdateManyAndReturnArgs>(args: SelectSubset<T, ProgressiveDiscountStepUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProgressiveDiscountStepPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ProgressiveDiscountStep.
     * @param {ProgressiveDiscountStepUpsertArgs} args - Arguments to update or create a ProgressiveDiscountStep.
     * @example
     * // Update or create a ProgressiveDiscountStep
     * const progressiveDiscountStep = await prisma.progressiveDiscountStep.upsert({
     *   create: {
     *     // ... data to create a ProgressiveDiscountStep
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ProgressiveDiscountStep we want to update
     *   }
     * })
     */
    upsert<T extends ProgressiveDiscountStepUpsertArgs>(args: SelectSubset<T, ProgressiveDiscountStepUpsertArgs<ExtArgs>>): Prisma__ProgressiveDiscountStepClient<$Result.GetResult<Prisma.$ProgressiveDiscountStepPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ProgressiveDiscountSteps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProgressiveDiscountStepCountArgs} args - Arguments to filter ProgressiveDiscountSteps to count.
     * @example
     * // Count the number of ProgressiveDiscountSteps
     * const count = await prisma.progressiveDiscountStep.count({
     *   where: {
     *     // ... the filter for the ProgressiveDiscountSteps we want to count
     *   }
     * })
    **/
    count<T extends ProgressiveDiscountStepCountArgs>(
      args?: Subset<T, ProgressiveDiscountStepCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProgressiveDiscountStepCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ProgressiveDiscountStep.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProgressiveDiscountStepAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProgressiveDiscountStepAggregateArgs>(args: Subset<T, ProgressiveDiscountStepAggregateArgs>): Prisma.PrismaPromise<GetProgressiveDiscountStepAggregateType<T>>

    /**
     * Group by ProgressiveDiscountStep.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProgressiveDiscountStepGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProgressiveDiscountStepGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProgressiveDiscountStepGroupByArgs['orderBy'] }
        : { orderBy?: ProgressiveDiscountStepGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProgressiveDiscountStepGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProgressiveDiscountStepGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ProgressiveDiscountStep model
   */
  readonly fields: ProgressiveDiscountStepFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ProgressiveDiscountStep.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProgressiveDiscountStepClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    progressiveDiscount<T extends ProgressiveDiscountDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProgressiveDiscountDefaultArgs<ExtArgs>>): Prisma__ProgressiveDiscountClient<$Result.GetResult<Prisma.$ProgressiveDiscountPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ProgressiveDiscountStep model
   */
  interface ProgressiveDiscountStepFieldRefs {
    readonly id: FieldRef<"ProgressiveDiscountStep", 'String'>
    readonly createdAt: FieldRef<"ProgressiveDiscountStep", 'DateTime'>
    readonly amount: FieldRef<"ProgressiveDiscountStep", 'Int'>
    readonly discount: FieldRef<"ProgressiveDiscountStep", 'Int'>
    readonly discountType: FieldRef<"ProgressiveDiscountStep", 'ProgressiveDiscountStepType'>
    readonly progressiveDiscountId: FieldRef<"ProgressiveDiscountStep", 'String'>
  }
    

  // Custom InputTypes
  /**
   * ProgressiveDiscountStep findUnique
   */
  export type ProgressiveDiscountStepFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscountStep
     */
    select?: ProgressiveDiscountStepSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscountStep
     */
    omit?: ProgressiveDiscountStepOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountStepInclude<ExtArgs> | null
    /**
     * Filter, which ProgressiveDiscountStep to fetch.
     */
    where: ProgressiveDiscountStepWhereUniqueInput
  }

  /**
   * ProgressiveDiscountStep findUniqueOrThrow
   */
  export type ProgressiveDiscountStepFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscountStep
     */
    select?: ProgressiveDiscountStepSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscountStep
     */
    omit?: ProgressiveDiscountStepOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountStepInclude<ExtArgs> | null
    /**
     * Filter, which ProgressiveDiscountStep to fetch.
     */
    where: ProgressiveDiscountStepWhereUniqueInput
  }

  /**
   * ProgressiveDiscountStep findFirst
   */
  export type ProgressiveDiscountStepFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscountStep
     */
    select?: ProgressiveDiscountStepSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscountStep
     */
    omit?: ProgressiveDiscountStepOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountStepInclude<ExtArgs> | null
    /**
     * Filter, which ProgressiveDiscountStep to fetch.
     */
    where?: ProgressiveDiscountStepWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProgressiveDiscountSteps to fetch.
     */
    orderBy?: ProgressiveDiscountStepOrderByWithRelationInput | ProgressiveDiscountStepOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProgressiveDiscountSteps.
     */
    cursor?: ProgressiveDiscountStepWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProgressiveDiscountSteps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProgressiveDiscountSteps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProgressiveDiscountSteps.
     */
    distinct?: ProgressiveDiscountStepScalarFieldEnum | ProgressiveDiscountStepScalarFieldEnum[]
  }

  /**
   * ProgressiveDiscountStep findFirstOrThrow
   */
  export type ProgressiveDiscountStepFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscountStep
     */
    select?: ProgressiveDiscountStepSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscountStep
     */
    omit?: ProgressiveDiscountStepOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountStepInclude<ExtArgs> | null
    /**
     * Filter, which ProgressiveDiscountStep to fetch.
     */
    where?: ProgressiveDiscountStepWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProgressiveDiscountSteps to fetch.
     */
    orderBy?: ProgressiveDiscountStepOrderByWithRelationInput | ProgressiveDiscountStepOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProgressiveDiscountSteps.
     */
    cursor?: ProgressiveDiscountStepWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProgressiveDiscountSteps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProgressiveDiscountSteps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProgressiveDiscountSteps.
     */
    distinct?: ProgressiveDiscountStepScalarFieldEnum | ProgressiveDiscountStepScalarFieldEnum[]
  }

  /**
   * ProgressiveDiscountStep findMany
   */
  export type ProgressiveDiscountStepFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscountStep
     */
    select?: ProgressiveDiscountStepSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscountStep
     */
    omit?: ProgressiveDiscountStepOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountStepInclude<ExtArgs> | null
    /**
     * Filter, which ProgressiveDiscountSteps to fetch.
     */
    where?: ProgressiveDiscountStepWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProgressiveDiscountSteps to fetch.
     */
    orderBy?: ProgressiveDiscountStepOrderByWithRelationInput | ProgressiveDiscountStepOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ProgressiveDiscountSteps.
     */
    cursor?: ProgressiveDiscountStepWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProgressiveDiscountSteps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProgressiveDiscountSteps.
     */
    skip?: number
    distinct?: ProgressiveDiscountStepScalarFieldEnum | ProgressiveDiscountStepScalarFieldEnum[]
  }

  /**
   * ProgressiveDiscountStep create
   */
  export type ProgressiveDiscountStepCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscountStep
     */
    select?: ProgressiveDiscountStepSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscountStep
     */
    omit?: ProgressiveDiscountStepOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountStepInclude<ExtArgs> | null
    /**
     * The data needed to create a ProgressiveDiscountStep.
     */
    data: XOR<ProgressiveDiscountStepCreateInput, ProgressiveDiscountStepUncheckedCreateInput>
  }

  /**
   * ProgressiveDiscountStep createMany
   */
  export type ProgressiveDiscountStepCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ProgressiveDiscountSteps.
     */
    data: ProgressiveDiscountStepCreateManyInput | ProgressiveDiscountStepCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ProgressiveDiscountStep createManyAndReturn
   */
  export type ProgressiveDiscountStepCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscountStep
     */
    select?: ProgressiveDiscountStepSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscountStep
     */
    omit?: ProgressiveDiscountStepOmit<ExtArgs> | null
    /**
     * The data used to create many ProgressiveDiscountSteps.
     */
    data: ProgressiveDiscountStepCreateManyInput | ProgressiveDiscountStepCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountStepIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ProgressiveDiscountStep update
   */
  export type ProgressiveDiscountStepUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscountStep
     */
    select?: ProgressiveDiscountStepSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscountStep
     */
    omit?: ProgressiveDiscountStepOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountStepInclude<ExtArgs> | null
    /**
     * The data needed to update a ProgressiveDiscountStep.
     */
    data: XOR<ProgressiveDiscountStepUpdateInput, ProgressiveDiscountStepUncheckedUpdateInput>
    /**
     * Choose, which ProgressiveDiscountStep to update.
     */
    where: ProgressiveDiscountStepWhereUniqueInput
  }

  /**
   * ProgressiveDiscountStep updateMany
   */
  export type ProgressiveDiscountStepUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ProgressiveDiscountSteps.
     */
    data: XOR<ProgressiveDiscountStepUpdateManyMutationInput, ProgressiveDiscountStepUncheckedUpdateManyInput>
    /**
     * Filter which ProgressiveDiscountSteps to update
     */
    where?: ProgressiveDiscountStepWhereInput
    /**
     * Limit how many ProgressiveDiscountSteps to update.
     */
    limit?: number
  }

  /**
   * ProgressiveDiscountStep updateManyAndReturn
   */
  export type ProgressiveDiscountStepUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscountStep
     */
    select?: ProgressiveDiscountStepSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscountStep
     */
    omit?: ProgressiveDiscountStepOmit<ExtArgs> | null
    /**
     * The data used to update ProgressiveDiscountSteps.
     */
    data: XOR<ProgressiveDiscountStepUpdateManyMutationInput, ProgressiveDiscountStepUncheckedUpdateManyInput>
    /**
     * Filter which ProgressiveDiscountSteps to update
     */
    where?: ProgressiveDiscountStepWhereInput
    /**
     * Limit how many ProgressiveDiscountSteps to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountStepIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ProgressiveDiscountStep upsert
   */
  export type ProgressiveDiscountStepUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscountStep
     */
    select?: ProgressiveDiscountStepSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscountStep
     */
    omit?: ProgressiveDiscountStepOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountStepInclude<ExtArgs> | null
    /**
     * The filter to search for the ProgressiveDiscountStep to update in case it exists.
     */
    where: ProgressiveDiscountStepWhereUniqueInput
    /**
     * In case the ProgressiveDiscountStep found by the `where` argument doesn't exist, create a new ProgressiveDiscountStep with this data.
     */
    create: XOR<ProgressiveDiscountStepCreateInput, ProgressiveDiscountStepUncheckedCreateInput>
    /**
     * In case the ProgressiveDiscountStep was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProgressiveDiscountStepUpdateInput, ProgressiveDiscountStepUncheckedUpdateInput>
  }

  /**
   * ProgressiveDiscountStep delete
   */
  export type ProgressiveDiscountStepDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscountStep
     */
    select?: ProgressiveDiscountStepSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscountStep
     */
    omit?: ProgressiveDiscountStepOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountStepInclude<ExtArgs> | null
    /**
     * Filter which ProgressiveDiscountStep to delete.
     */
    where: ProgressiveDiscountStepWhereUniqueInput
  }

  /**
   * ProgressiveDiscountStep deleteMany
   */
  export type ProgressiveDiscountStepDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProgressiveDiscountSteps to delete
     */
    where?: ProgressiveDiscountStepWhereInput
    /**
     * Limit how many ProgressiveDiscountSteps to delete.
     */
    limit?: number
  }

  /**
   * ProgressiveDiscountStep without action
   */
  export type ProgressiveDiscountStepDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgressiveDiscountStep
     */
    select?: ProgressiveDiscountStepSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProgressiveDiscountStep
     */
    omit?: ProgressiveDiscountStepOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgressiveDiscountStepInclude<ExtArgs> | null
  }


  /**
   * Model File
   */

  export type AggregateFile = {
    _count: FileCountAggregateOutputType | null
    _avg: FileAvgAggregateOutputType | null
    _sum: FileSumAggregateOutputType | null
    _min: FileMinAggregateOutputType | null
    _max: FileMaxAggregateOutputType | null
  }

  export type FileAvgAggregateOutputType = {
    size: number | null
  }

  export type FileSumAggregateOutputType = {
    size: number | null
  }

  export type FileMinAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    name: string | null
    url: string | null
    size: number | null
    productId: string | null
  }

  export type FileMaxAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    name: string | null
    url: string | null
    size: number | null
    productId: string | null
  }

  export type FileCountAggregateOutputType = {
    id: number
    createdAt: number
    name: number
    url: number
    size: number
    productId: number
    _all: number
  }


  export type FileAvgAggregateInputType = {
    size?: true
  }

  export type FileSumAggregateInputType = {
    size?: true
  }

  export type FileMinAggregateInputType = {
    id?: true
    createdAt?: true
    name?: true
    url?: true
    size?: true
    productId?: true
  }

  export type FileMaxAggregateInputType = {
    id?: true
    createdAt?: true
    name?: true
    url?: true
    size?: true
    productId?: true
  }

  export type FileCountAggregateInputType = {
    id?: true
    createdAt?: true
    name?: true
    url?: true
    size?: true
    productId?: true
    _all?: true
  }

  export type FileAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which File to aggregate.
     */
    where?: FileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Files to fetch.
     */
    orderBy?: FileOrderByWithRelationInput | FileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Files from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Files.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Files
    **/
    _count?: true | FileCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: FileAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: FileSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FileMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FileMaxAggregateInputType
  }

  export type GetFileAggregateType<T extends FileAggregateArgs> = {
        [P in keyof T & keyof AggregateFile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFile[P]>
      : GetScalarType<T[P], AggregateFile[P]>
  }




  export type FileGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FileWhereInput
    orderBy?: FileOrderByWithAggregationInput | FileOrderByWithAggregationInput[]
    by: FileScalarFieldEnum[] | FileScalarFieldEnum
    having?: FileScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FileCountAggregateInputType | true
    _avg?: FileAvgAggregateInputType
    _sum?: FileSumAggregateInputType
    _min?: FileMinAggregateInputType
    _max?: FileMaxAggregateInputType
  }

  export type FileGroupByOutputType = {
    id: string
    createdAt: Date
    name: string
    url: string
    size: number
    productId: string | null
    _count: FileCountAggregateOutputType | null
    _avg: FileAvgAggregateOutputType | null
    _sum: FileSumAggregateOutputType | null
    _min: FileMinAggregateOutputType | null
    _max: FileMaxAggregateOutputType | null
  }

  type GetFileGroupByPayload<T extends FileGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FileGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FileGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FileGroupByOutputType[P]>
            : GetScalarType<T[P], FileGroupByOutputType[P]>
        }
      >
    >


  export type FileSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    name?: boolean
    url?: boolean
    size?: boolean
    productId?: boolean
    product?: boolean | File$productArgs<ExtArgs>
  }, ExtArgs["result"]["file"]>

  export type FileSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    name?: boolean
    url?: boolean
    size?: boolean
    productId?: boolean
    product?: boolean | File$productArgs<ExtArgs>
  }, ExtArgs["result"]["file"]>

  export type FileSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    name?: boolean
    url?: boolean
    size?: boolean
    productId?: boolean
    product?: boolean | File$productArgs<ExtArgs>
  }, ExtArgs["result"]["file"]>

  export type FileSelectScalar = {
    id?: boolean
    createdAt?: boolean
    name?: boolean
    url?: boolean
    size?: boolean
    productId?: boolean
  }

  export type FileOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "name" | "url" | "size" | "productId", ExtArgs["result"]["file"]>
  export type FileInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | File$productArgs<ExtArgs>
  }
  export type FileIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | File$productArgs<ExtArgs>
  }
  export type FileIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | File$productArgs<ExtArgs>
  }

  export type $FilePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "File"
    objects: {
      product: Prisma.$ProductPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      createdAt: Date
      name: string
      url: string
      size: number
      productId: string | null
    }, ExtArgs["result"]["file"]>
    composites: {}
  }

  type FileGetPayload<S extends boolean | null | undefined | FileDefaultArgs> = $Result.GetResult<Prisma.$FilePayload, S>

  type FileCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<FileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: FileCountAggregateInputType | true
    }

  export interface FileDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['File'], meta: { name: 'File' } }
    /**
     * Find zero or one File that matches the filter.
     * @param {FileFindUniqueArgs} args - Arguments to find a File
     * @example
     * // Get one File
     * const file = await prisma.file.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FileFindUniqueArgs>(args: SelectSubset<T, FileFindUniqueArgs<ExtArgs>>): Prisma__FileClient<$Result.GetResult<Prisma.$FilePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one File that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {FileFindUniqueOrThrowArgs} args - Arguments to find a File
     * @example
     * // Get one File
     * const file = await prisma.file.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FileFindUniqueOrThrowArgs>(args: SelectSubset<T, FileFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FileClient<$Result.GetResult<Prisma.$FilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first File that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FileFindFirstArgs} args - Arguments to find a File
     * @example
     * // Get one File
     * const file = await prisma.file.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FileFindFirstArgs>(args?: SelectSubset<T, FileFindFirstArgs<ExtArgs>>): Prisma__FileClient<$Result.GetResult<Prisma.$FilePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first File that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FileFindFirstOrThrowArgs} args - Arguments to find a File
     * @example
     * // Get one File
     * const file = await prisma.file.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FileFindFirstOrThrowArgs>(args?: SelectSubset<T, FileFindFirstOrThrowArgs<ExtArgs>>): Prisma__FileClient<$Result.GetResult<Prisma.$FilePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Files that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Files
     * const files = await prisma.file.findMany()
     * 
     * // Get first 10 Files
     * const files = await prisma.file.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const fileWithIdOnly = await prisma.file.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FileFindManyArgs>(args?: SelectSubset<T, FileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a File.
     * @param {FileCreateArgs} args - Arguments to create a File.
     * @example
     * // Create one File
     * const File = await prisma.file.create({
     *   data: {
     *     // ... data to create a File
     *   }
     * })
     * 
     */
    create<T extends FileCreateArgs>(args: SelectSubset<T, FileCreateArgs<ExtArgs>>): Prisma__FileClient<$Result.GetResult<Prisma.$FilePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Files.
     * @param {FileCreateManyArgs} args - Arguments to create many Files.
     * @example
     * // Create many Files
     * const file = await prisma.file.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FileCreateManyArgs>(args?: SelectSubset<T, FileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Files and returns the data saved in the database.
     * @param {FileCreateManyAndReturnArgs} args - Arguments to create many Files.
     * @example
     * // Create many Files
     * const file = await prisma.file.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Files and only return the `id`
     * const fileWithIdOnly = await prisma.file.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends FileCreateManyAndReturnArgs>(args?: SelectSubset<T, FileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FilePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a File.
     * @param {FileDeleteArgs} args - Arguments to delete one File.
     * @example
     * // Delete one File
     * const File = await prisma.file.delete({
     *   where: {
     *     // ... filter to delete one File
     *   }
     * })
     * 
     */
    delete<T extends FileDeleteArgs>(args: SelectSubset<T, FileDeleteArgs<ExtArgs>>): Prisma__FileClient<$Result.GetResult<Prisma.$FilePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one File.
     * @param {FileUpdateArgs} args - Arguments to update one File.
     * @example
     * // Update one File
     * const file = await prisma.file.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FileUpdateArgs>(args: SelectSubset<T, FileUpdateArgs<ExtArgs>>): Prisma__FileClient<$Result.GetResult<Prisma.$FilePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Files.
     * @param {FileDeleteManyArgs} args - Arguments to filter Files to delete.
     * @example
     * // Delete a few Files
     * const { count } = await prisma.file.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FileDeleteManyArgs>(args?: SelectSubset<T, FileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Files.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Files
     * const file = await prisma.file.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FileUpdateManyArgs>(args: SelectSubset<T, FileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Files and returns the data updated in the database.
     * @param {FileUpdateManyAndReturnArgs} args - Arguments to update many Files.
     * @example
     * // Update many Files
     * const file = await prisma.file.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Files and only return the `id`
     * const fileWithIdOnly = await prisma.file.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends FileUpdateManyAndReturnArgs>(args: SelectSubset<T, FileUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FilePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one File.
     * @param {FileUpsertArgs} args - Arguments to update or create a File.
     * @example
     * // Update or create a File
     * const file = await prisma.file.upsert({
     *   create: {
     *     // ... data to create a File
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the File we want to update
     *   }
     * })
     */
    upsert<T extends FileUpsertArgs>(args: SelectSubset<T, FileUpsertArgs<ExtArgs>>): Prisma__FileClient<$Result.GetResult<Prisma.$FilePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Files.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FileCountArgs} args - Arguments to filter Files to count.
     * @example
     * // Count the number of Files
     * const count = await prisma.file.count({
     *   where: {
     *     // ... the filter for the Files we want to count
     *   }
     * })
    **/
    count<T extends FileCountArgs>(
      args?: Subset<T, FileCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FileCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a File.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FileAggregateArgs>(args: Subset<T, FileAggregateArgs>): Prisma.PrismaPromise<GetFileAggregateType<T>>

    /**
     * Group by File.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FileGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends FileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FileGroupByArgs['orderBy'] }
        : { orderBy?: FileGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the File model
   */
  readonly fields: FileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for File.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FileClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    product<T extends File$productArgs<ExtArgs> = {}>(args?: Subset<T, File$productArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the File model
   */
  interface FileFieldRefs {
    readonly id: FieldRef<"File", 'String'>
    readonly createdAt: FieldRef<"File", 'DateTime'>
    readonly name: FieldRef<"File", 'String'>
    readonly url: FieldRef<"File", 'String'>
    readonly size: FieldRef<"File", 'Int'>
    readonly productId: FieldRef<"File", 'String'>
  }
    

  // Custom InputTypes
  /**
   * File findUnique
   */
  export type FileFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the File
     */
    select?: FileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the File
     */
    omit?: FileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FileInclude<ExtArgs> | null
    /**
     * Filter, which File to fetch.
     */
    where: FileWhereUniqueInput
  }

  /**
   * File findUniqueOrThrow
   */
  export type FileFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the File
     */
    select?: FileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the File
     */
    omit?: FileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FileInclude<ExtArgs> | null
    /**
     * Filter, which File to fetch.
     */
    where: FileWhereUniqueInput
  }

  /**
   * File findFirst
   */
  export type FileFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the File
     */
    select?: FileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the File
     */
    omit?: FileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FileInclude<ExtArgs> | null
    /**
     * Filter, which File to fetch.
     */
    where?: FileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Files to fetch.
     */
    orderBy?: FileOrderByWithRelationInput | FileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Files.
     */
    cursor?: FileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Files from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Files.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Files.
     */
    distinct?: FileScalarFieldEnum | FileScalarFieldEnum[]
  }

  /**
   * File findFirstOrThrow
   */
  export type FileFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the File
     */
    select?: FileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the File
     */
    omit?: FileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FileInclude<ExtArgs> | null
    /**
     * Filter, which File to fetch.
     */
    where?: FileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Files to fetch.
     */
    orderBy?: FileOrderByWithRelationInput | FileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Files.
     */
    cursor?: FileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Files from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Files.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Files.
     */
    distinct?: FileScalarFieldEnum | FileScalarFieldEnum[]
  }

  /**
   * File findMany
   */
  export type FileFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the File
     */
    select?: FileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the File
     */
    omit?: FileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FileInclude<ExtArgs> | null
    /**
     * Filter, which Files to fetch.
     */
    where?: FileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Files to fetch.
     */
    orderBy?: FileOrderByWithRelationInput | FileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Files.
     */
    cursor?: FileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Files from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Files.
     */
    skip?: number
    distinct?: FileScalarFieldEnum | FileScalarFieldEnum[]
  }

  /**
   * File create
   */
  export type FileCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the File
     */
    select?: FileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the File
     */
    omit?: FileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FileInclude<ExtArgs> | null
    /**
     * The data needed to create a File.
     */
    data: XOR<FileCreateInput, FileUncheckedCreateInput>
  }

  /**
   * File createMany
   */
  export type FileCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Files.
     */
    data: FileCreateManyInput | FileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * File createManyAndReturn
   */
  export type FileCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the File
     */
    select?: FileSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the File
     */
    omit?: FileOmit<ExtArgs> | null
    /**
     * The data used to create many Files.
     */
    data: FileCreateManyInput | FileCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FileIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * File update
   */
  export type FileUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the File
     */
    select?: FileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the File
     */
    omit?: FileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FileInclude<ExtArgs> | null
    /**
     * The data needed to update a File.
     */
    data: XOR<FileUpdateInput, FileUncheckedUpdateInput>
    /**
     * Choose, which File to update.
     */
    where: FileWhereUniqueInput
  }

  /**
   * File updateMany
   */
  export type FileUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Files.
     */
    data: XOR<FileUpdateManyMutationInput, FileUncheckedUpdateManyInput>
    /**
     * Filter which Files to update
     */
    where?: FileWhereInput
    /**
     * Limit how many Files to update.
     */
    limit?: number
  }

  /**
   * File updateManyAndReturn
   */
  export type FileUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the File
     */
    select?: FileSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the File
     */
    omit?: FileOmit<ExtArgs> | null
    /**
     * The data used to update Files.
     */
    data: XOR<FileUpdateManyMutationInput, FileUncheckedUpdateManyInput>
    /**
     * Filter which Files to update
     */
    where?: FileWhereInput
    /**
     * Limit how many Files to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FileIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * File upsert
   */
  export type FileUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the File
     */
    select?: FileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the File
     */
    omit?: FileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FileInclude<ExtArgs> | null
    /**
     * The filter to search for the File to update in case it exists.
     */
    where: FileWhereUniqueInput
    /**
     * In case the File found by the `where` argument doesn't exist, create a new File with this data.
     */
    create: XOR<FileCreateInput, FileUncheckedCreateInput>
    /**
     * In case the File was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FileUpdateInput, FileUncheckedUpdateInput>
  }

  /**
   * File delete
   */
  export type FileDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the File
     */
    select?: FileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the File
     */
    omit?: FileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FileInclude<ExtArgs> | null
    /**
     * Filter which File to delete.
     */
    where: FileWhereUniqueInput
  }

  /**
   * File deleteMany
   */
  export type FileDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Files to delete
     */
    where?: FileWhereInput
    /**
     * Limit how many Files to delete.
     */
    limit?: number
  }

  /**
   * File.product
   */
  export type File$productArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    where?: ProductWhereInput
  }

  /**
   * File without action
   */
  export type FileDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the File
     */
    select?: FileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the File
     */
    omit?: FileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FileInclude<ExtArgs> | null
  }


  /**
   * Model ModifierGroup
   */

  export type AggregateModifierGroup = {
    _count: ModifierGroupCountAggregateOutputType | null
    _avg: ModifierGroupAvgAggregateOutputType | null
    _sum: ModifierGroupSumAggregateOutputType | null
    _min: ModifierGroupMinAggregateOutputType | null
    _max: ModifierGroupMaxAggregateOutputType | null
  }

  export type ModifierGroupAvgAggregateOutputType = {
    minSelection: number | null
    maxSelection: number | null
  }

  export type ModifierGroupSumAggregateOutputType = {
    minSelection: number | null
    maxSelection: number | null
  }

  export type ModifierGroupMinAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    title: string | null
    required: boolean | null
    type: $Enums.ModifierGroupType | null
    productId: string | null
    minSelection: number | null
    maxSelection: number | null
  }

  export type ModifierGroupMaxAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    title: string | null
    required: boolean | null
    type: $Enums.ModifierGroupType | null
    productId: string | null
    minSelection: number | null
    maxSelection: number | null
  }

  export type ModifierGroupCountAggregateOutputType = {
    id: number
    createdAt: number
    title: number
    required: number
    type: number
    productId: number
    minSelection: number
    maxSelection: number
    _all: number
  }


  export type ModifierGroupAvgAggregateInputType = {
    minSelection?: true
    maxSelection?: true
  }

  export type ModifierGroupSumAggregateInputType = {
    minSelection?: true
    maxSelection?: true
  }

  export type ModifierGroupMinAggregateInputType = {
    id?: true
    createdAt?: true
    title?: true
    required?: true
    type?: true
    productId?: true
    minSelection?: true
    maxSelection?: true
  }

  export type ModifierGroupMaxAggregateInputType = {
    id?: true
    createdAt?: true
    title?: true
    required?: true
    type?: true
    productId?: true
    minSelection?: true
    maxSelection?: true
  }

  export type ModifierGroupCountAggregateInputType = {
    id?: true
    createdAt?: true
    title?: true
    required?: true
    type?: true
    productId?: true
    minSelection?: true
    maxSelection?: true
    _all?: true
  }

  export type ModifierGroupAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModifierGroup to aggregate.
     */
    where?: ModifierGroupWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModifierGroups to fetch.
     */
    orderBy?: ModifierGroupOrderByWithRelationInput | ModifierGroupOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ModifierGroupWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModifierGroups from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModifierGroups.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ModifierGroups
    **/
    _count?: true | ModifierGroupCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ModifierGroupAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ModifierGroupSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ModifierGroupMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ModifierGroupMaxAggregateInputType
  }

  export type GetModifierGroupAggregateType<T extends ModifierGroupAggregateArgs> = {
        [P in keyof T & keyof AggregateModifierGroup]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateModifierGroup[P]>
      : GetScalarType<T[P], AggregateModifierGroup[P]>
  }




  export type ModifierGroupGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ModifierGroupWhereInput
    orderBy?: ModifierGroupOrderByWithAggregationInput | ModifierGroupOrderByWithAggregationInput[]
    by: ModifierGroupScalarFieldEnum[] | ModifierGroupScalarFieldEnum
    having?: ModifierGroupScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ModifierGroupCountAggregateInputType | true
    _avg?: ModifierGroupAvgAggregateInputType
    _sum?: ModifierGroupSumAggregateInputType
    _min?: ModifierGroupMinAggregateInputType
    _max?: ModifierGroupMaxAggregateInputType
  }

  export type ModifierGroupGroupByOutputType = {
    id: string
    createdAt: Date
    title: string
    required: boolean
    type: $Enums.ModifierGroupType | null
    productId: string | null
    minSelection: number | null
    maxSelection: number | null
    _count: ModifierGroupCountAggregateOutputType | null
    _avg: ModifierGroupAvgAggregateOutputType | null
    _sum: ModifierGroupSumAggregateOutputType | null
    _min: ModifierGroupMinAggregateOutputType | null
    _max: ModifierGroupMaxAggregateOutputType | null
  }

  type GetModifierGroupGroupByPayload<T extends ModifierGroupGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ModifierGroupGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ModifierGroupGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ModifierGroupGroupByOutputType[P]>
            : GetScalarType<T[P], ModifierGroupGroupByOutputType[P]>
        }
      >
    >


  export type ModifierGroupSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    title?: boolean
    required?: boolean
    type?: boolean
    productId?: boolean
    minSelection?: boolean
    maxSelection?: boolean
    product?: boolean | ModifierGroup$productArgs<ExtArgs>
  }, ExtArgs["result"]["modifierGroup"]>

  export type ModifierGroupSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    title?: boolean
    required?: boolean
    type?: boolean
    productId?: boolean
    minSelection?: boolean
    maxSelection?: boolean
    product?: boolean | ModifierGroup$productArgs<ExtArgs>
  }, ExtArgs["result"]["modifierGroup"]>

  export type ModifierGroupSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    title?: boolean
    required?: boolean
    type?: boolean
    productId?: boolean
    minSelection?: boolean
    maxSelection?: boolean
    product?: boolean | ModifierGroup$productArgs<ExtArgs>
  }, ExtArgs["result"]["modifierGroup"]>

  export type ModifierGroupSelectScalar = {
    id?: boolean
    createdAt?: boolean
    title?: boolean
    required?: boolean
    type?: boolean
    productId?: boolean
    minSelection?: boolean
    maxSelection?: boolean
  }

  export type ModifierGroupOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "title" | "required" | "type" | "productId" | "minSelection" | "maxSelection", ExtArgs["result"]["modifierGroup"]>
  export type ModifierGroupInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | ModifierGroup$productArgs<ExtArgs>
  }
  export type ModifierGroupIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | ModifierGroup$productArgs<ExtArgs>
  }
  export type ModifierGroupIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | ModifierGroup$productArgs<ExtArgs>
  }

  export type $ModifierGroupPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ModifierGroup"
    objects: {
      product: Prisma.$ProductPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      createdAt: Date
      title: string
      required: boolean
      type: $Enums.ModifierGroupType | null
      productId: string | null
      minSelection: number | null
      maxSelection: number | null
    }, ExtArgs["result"]["modifierGroup"]>
    composites: {}
  }

  type ModifierGroupGetPayload<S extends boolean | null | undefined | ModifierGroupDefaultArgs> = $Result.GetResult<Prisma.$ModifierGroupPayload, S>

  type ModifierGroupCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ModifierGroupFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ModifierGroupCountAggregateInputType | true
    }

  export interface ModifierGroupDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ModifierGroup'], meta: { name: 'ModifierGroup' } }
    /**
     * Find zero or one ModifierGroup that matches the filter.
     * @param {ModifierGroupFindUniqueArgs} args - Arguments to find a ModifierGroup
     * @example
     * // Get one ModifierGroup
     * const modifierGroup = await prisma.modifierGroup.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ModifierGroupFindUniqueArgs>(args: SelectSubset<T, ModifierGroupFindUniqueArgs<ExtArgs>>): Prisma__ModifierGroupClient<$Result.GetResult<Prisma.$ModifierGroupPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ModifierGroup that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ModifierGroupFindUniqueOrThrowArgs} args - Arguments to find a ModifierGroup
     * @example
     * // Get one ModifierGroup
     * const modifierGroup = await prisma.modifierGroup.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ModifierGroupFindUniqueOrThrowArgs>(args: SelectSubset<T, ModifierGroupFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ModifierGroupClient<$Result.GetResult<Prisma.$ModifierGroupPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModifierGroup that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModifierGroupFindFirstArgs} args - Arguments to find a ModifierGroup
     * @example
     * // Get one ModifierGroup
     * const modifierGroup = await prisma.modifierGroup.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ModifierGroupFindFirstArgs>(args?: SelectSubset<T, ModifierGroupFindFirstArgs<ExtArgs>>): Prisma__ModifierGroupClient<$Result.GetResult<Prisma.$ModifierGroupPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModifierGroup that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModifierGroupFindFirstOrThrowArgs} args - Arguments to find a ModifierGroup
     * @example
     * // Get one ModifierGroup
     * const modifierGroup = await prisma.modifierGroup.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ModifierGroupFindFirstOrThrowArgs>(args?: SelectSubset<T, ModifierGroupFindFirstOrThrowArgs<ExtArgs>>): Prisma__ModifierGroupClient<$Result.GetResult<Prisma.$ModifierGroupPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ModifierGroups that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModifierGroupFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ModifierGroups
     * const modifierGroups = await prisma.modifierGroup.findMany()
     * 
     * // Get first 10 ModifierGroups
     * const modifierGroups = await prisma.modifierGroup.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const modifierGroupWithIdOnly = await prisma.modifierGroup.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ModifierGroupFindManyArgs>(args?: SelectSubset<T, ModifierGroupFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModifierGroupPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ModifierGroup.
     * @param {ModifierGroupCreateArgs} args - Arguments to create a ModifierGroup.
     * @example
     * // Create one ModifierGroup
     * const ModifierGroup = await prisma.modifierGroup.create({
     *   data: {
     *     // ... data to create a ModifierGroup
     *   }
     * })
     * 
     */
    create<T extends ModifierGroupCreateArgs>(args: SelectSubset<T, ModifierGroupCreateArgs<ExtArgs>>): Prisma__ModifierGroupClient<$Result.GetResult<Prisma.$ModifierGroupPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ModifierGroups.
     * @param {ModifierGroupCreateManyArgs} args - Arguments to create many ModifierGroups.
     * @example
     * // Create many ModifierGroups
     * const modifierGroup = await prisma.modifierGroup.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ModifierGroupCreateManyArgs>(args?: SelectSubset<T, ModifierGroupCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ModifierGroups and returns the data saved in the database.
     * @param {ModifierGroupCreateManyAndReturnArgs} args - Arguments to create many ModifierGroups.
     * @example
     * // Create many ModifierGroups
     * const modifierGroup = await prisma.modifierGroup.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ModifierGroups and only return the `id`
     * const modifierGroupWithIdOnly = await prisma.modifierGroup.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ModifierGroupCreateManyAndReturnArgs>(args?: SelectSubset<T, ModifierGroupCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModifierGroupPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ModifierGroup.
     * @param {ModifierGroupDeleteArgs} args - Arguments to delete one ModifierGroup.
     * @example
     * // Delete one ModifierGroup
     * const ModifierGroup = await prisma.modifierGroup.delete({
     *   where: {
     *     // ... filter to delete one ModifierGroup
     *   }
     * })
     * 
     */
    delete<T extends ModifierGroupDeleteArgs>(args: SelectSubset<T, ModifierGroupDeleteArgs<ExtArgs>>): Prisma__ModifierGroupClient<$Result.GetResult<Prisma.$ModifierGroupPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ModifierGroup.
     * @param {ModifierGroupUpdateArgs} args - Arguments to update one ModifierGroup.
     * @example
     * // Update one ModifierGroup
     * const modifierGroup = await prisma.modifierGroup.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ModifierGroupUpdateArgs>(args: SelectSubset<T, ModifierGroupUpdateArgs<ExtArgs>>): Prisma__ModifierGroupClient<$Result.GetResult<Prisma.$ModifierGroupPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ModifierGroups.
     * @param {ModifierGroupDeleteManyArgs} args - Arguments to filter ModifierGroups to delete.
     * @example
     * // Delete a few ModifierGroups
     * const { count } = await prisma.modifierGroup.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ModifierGroupDeleteManyArgs>(args?: SelectSubset<T, ModifierGroupDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModifierGroups.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModifierGroupUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ModifierGroups
     * const modifierGroup = await prisma.modifierGroup.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ModifierGroupUpdateManyArgs>(args: SelectSubset<T, ModifierGroupUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModifierGroups and returns the data updated in the database.
     * @param {ModifierGroupUpdateManyAndReturnArgs} args - Arguments to update many ModifierGroups.
     * @example
     * // Update many ModifierGroups
     * const modifierGroup = await prisma.modifierGroup.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ModifierGroups and only return the `id`
     * const modifierGroupWithIdOnly = await prisma.modifierGroup.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ModifierGroupUpdateManyAndReturnArgs>(args: SelectSubset<T, ModifierGroupUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModifierGroupPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ModifierGroup.
     * @param {ModifierGroupUpsertArgs} args - Arguments to update or create a ModifierGroup.
     * @example
     * // Update or create a ModifierGroup
     * const modifierGroup = await prisma.modifierGroup.upsert({
     *   create: {
     *     // ... data to create a ModifierGroup
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ModifierGroup we want to update
     *   }
     * })
     */
    upsert<T extends ModifierGroupUpsertArgs>(args: SelectSubset<T, ModifierGroupUpsertArgs<ExtArgs>>): Prisma__ModifierGroupClient<$Result.GetResult<Prisma.$ModifierGroupPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ModifierGroups.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModifierGroupCountArgs} args - Arguments to filter ModifierGroups to count.
     * @example
     * // Count the number of ModifierGroups
     * const count = await prisma.modifierGroup.count({
     *   where: {
     *     // ... the filter for the ModifierGroups we want to count
     *   }
     * })
    **/
    count<T extends ModifierGroupCountArgs>(
      args?: Subset<T, ModifierGroupCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ModifierGroupCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ModifierGroup.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModifierGroupAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ModifierGroupAggregateArgs>(args: Subset<T, ModifierGroupAggregateArgs>): Prisma.PrismaPromise<GetModifierGroupAggregateType<T>>

    /**
     * Group by ModifierGroup.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModifierGroupGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ModifierGroupGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ModifierGroupGroupByArgs['orderBy'] }
        : { orderBy?: ModifierGroupGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ModifierGroupGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetModifierGroupGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ModifierGroup model
   */
  readonly fields: ModifierGroupFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ModifierGroup.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ModifierGroupClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    product<T extends ModifierGroup$productArgs<ExtArgs> = {}>(args?: Subset<T, ModifierGroup$productArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ModifierGroup model
   */
  interface ModifierGroupFieldRefs {
    readonly id: FieldRef<"ModifierGroup", 'String'>
    readonly createdAt: FieldRef<"ModifierGroup", 'DateTime'>
    readonly title: FieldRef<"ModifierGroup", 'String'>
    readonly required: FieldRef<"ModifierGroup", 'Boolean'>
    readonly type: FieldRef<"ModifierGroup", 'ModifierGroupType'>
    readonly productId: FieldRef<"ModifierGroup", 'String'>
    readonly minSelection: FieldRef<"ModifierGroup", 'Int'>
    readonly maxSelection: FieldRef<"ModifierGroup", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * ModifierGroup findUnique
   */
  export type ModifierGroupFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModifierGroup
     */
    select?: ModifierGroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModifierGroup
     */
    omit?: ModifierGroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModifierGroupInclude<ExtArgs> | null
    /**
     * Filter, which ModifierGroup to fetch.
     */
    where: ModifierGroupWhereUniqueInput
  }

  /**
   * ModifierGroup findUniqueOrThrow
   */
  export type ModifierGroupFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModifierGroup
     */
    select?: ModifierGroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModifierGroup
     */
    omit?: ModifierGroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModifierGroupInclude<ExtArgs> | null
    /**
     * Filter, which ModifierGroup to fetch.
     */
    where: ModifierGroupWhereUniqueInput
  }

  /**
   * ModifierGroup findFirst
   */
  export type ModifierGroupFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModifierGroup
     */
    select?: ModifierGroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModifierGroup
     */
    omit?: ModifierGroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModifierGroupInclude<ExtArgs> | null
    /**
     * Filter, which ModifierGroup to fetch.
     */
    where?: ModifierGroupWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModifierGroups to fetch.
     */
    orderBy?: ModifierGroupOrderByWithRelationInput | ModifierGroupOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModifierGroups.
     */
    cursor?: ModifierGroupWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModifierGroups from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModifierGroups.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModifierGroups.
     */
    distinct?: ModifierGroupScalarFieldEnum | ModifierGroupScalarFieldEnum[]
  }

  /**
   * ModifierGroup findFirstOrThrow
   */
  export type ModifierGroupFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModifierGroup
     */
    select?: ModifierGroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModifierGroup
     */
    omit?: ModifierGroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModifierGroupInclude<ExtArgs> | null
    /**
     * Filter, which ModifierGroup to fetch.
     */
    where?: ModifierGroupWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModifierGroups to fetch.
     */
    orderBy?: ModifierGroupOrderByWithRelationInput | ModifierGroupOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModifierGroups.
     */
    cursor?: ModifierGroupWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModifierGroups from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModifierGroups.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModifierGroups.
     */
    distinct?: ModifierGroupScalarFieldEnum | ModifierGroupScalarFieldEnum[]
  }

  /**
   * ModifierGroup findMany
   */
  export type ModifierGroupFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModifierGroup
     */
    select?: ModifierGroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModifierGroup
     */
    omit?: ModifierGroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModifierGroupInclude<ExtArgs> | null
    /**
     * Filter, which ModifierGroups to fetch.
     */
    where?: ModifierGroupWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModifierGroups to fetch.
     */
    orderBy?: ModifierGroupOrderByWithRelationInput | ModifierGroupOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ModifierGroups.
     */
    cursor?: ModifierGroupWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModifierGroups from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModifierGroups.
     */
    skip?: number
    distinct?: ModifierGroupScalarFieldEnum | ModifierGroupScalarFieldEnum[]
  }

  /**
   * ModifierGroup create
   */
  export type ModifierGroupCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModifierGroup
     */
    select?: ModifierGroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModifierGroup
     */
    omit?: ModifierGroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModifierGroupInclude<ExtArgs> | null
    /**
     * The data needed to create a ModifierGroup.
     */
    data: XOR<ModifierGroupCreateInput, ModifierGroupUncheckedCreateInput>
  }

  /**
   * ModifierGroup createMany
   */
  export type ModifierGroupCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ModifierGroups.
     */
    data: ModifierGroupCreateManyInput | ModifierGroupCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ModifierGroup createManyAndReturn
   */
  export type ModifierGroupCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModifierGroup
     */
    select?: ModifierGroupSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModifierGroup
     */
    omit?: ModifierGroupOmit<ExtArgs> | null
    /**
     * The data used to create many ModifierGroups.
     */
    data: ModifierGroupCreateManyInput | ModifierGroupCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModifierGroupIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ModifierGroup update
   */
  export type ModifierGroupUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModifierGroup
     */
    select?: ModifierGroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModifierGroup
     */
    omit?: ModifierGroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModifierGroupInclude<ExtArgs> | null
    /**
     * The data needed to update a ModifierGroup.
     */
    data: XOR<ModifierGroupUpdateInput, ModifierGroupUncheckedUpdateInput>
    /**
     * Choose, which ModifierGroup to update.
     */
    where: ModifierGroupWhereUniqueInput
  }

  /**
   * ModifierGroup updateMany
   */
  export type ModifierGroupUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ModifierGroups.
     */
    data: XOR<ModifierGroupUpdateManyMutationInput, ModifierGroupUncheckedUpdateManyInput>
    /**
     * Filter which ModifierGroups to update
     */
    where?: ModifierGroupWhereInput
    /**
     * Limit how many ModifierGroups to update.
     */
    limit?: number
  }

  /**
   * ModifierGroup updateManyAndReturn
   */
  export type ModifierGroupUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModifierGroup
     */
    select?: ModifierGroupSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModifierGroup
     */
    omit?: ModifierGroupOmit<ExtArgs> | null
    /**
     * The data used to update ModifierGroups.
     */
    data: XOR<ModifierGroupUpdateManyMutationInput, ModifierGroupUncheckedUpdateManyInput>
    /**
     * Filter which ModifierGroups to update
     */
    where?: ModifierGroupWhereInput
    /**
     * Limit how many ModifierGroups to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModifierGroupIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ModifierGroup upsert
   */
  export type ModifierGroupUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModifierGroup
     */
    select?: ModifierGroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModifierGroup
     */
    omit?: ModifierGroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModifierGroupInclude<ExtArgs> | null
    /**
     * The filter to search for the ModifierGroup to update in case it exists.
     */
    where: ModifierGroupWhereUniqueInput
    /**
     * In case the ModifierGroup found by the `where` argument doesn't exist, create a new ModifierGroup with this data.
     */
    create: XOR<ModifierGroupCreateInput, ModifierGroupUncheckedCreateInput>
    /**
     * In case the ModifierGroup was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ModifierGroupUpdateInput, ModifierGroupUncheckedUpdateInput>
  }

  /**
   * ModifierGroup delete
   */
  export type ModifierGroupDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModifierGroup
     */
    select?: ModifierGroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModifierGroup
     */
    omit?: ModifierGroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModifierGroupInclude<ExtArgs> | null
    /**
     * Filter which ModifierGroup to delete.
     */
    where: ModifierGroupWhereUniqueInput
  }

  /**
   * ModifierGroup deleteMany
   */
  export type ModifierGroupDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModifierGroups to delete
     */
    where?: ModifierGroupWhereInput
    /**
     * Limit how many ModifierGroups to delete.
     */
    limit?: number
  }

  /**
   * ModifierGroup.product
   */
  export type ModifierGroup$productArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    where?: ProductWhereInput
  }

  /**
   * ModifierGroup without action
   */
  export type ModifierGroupDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModifierGroup
     */
    select?: ModifierGroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModifierGroup
     */
    omit?: ModifierGroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModifierGroupInclude<ExtArgs> | null
  }


  /**
   * Model Business
   */

  export type AggregateBusiness = {
    _count: BusinessCountAggregateOutputType | null
    _min: BusinessMinAggregateOutputType | null
    _max: BusinessMaxAggregateOutputType | null
  }

  export type BusinessMinAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    name: string | null
  }

  export type BusinessMaxAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    name: string | null
  }

  export type BusinessCountAggregateOutputType = {
    id: number
    createdAt: number
    name: number
    _all: number
  }


  export type BusinessMinAggregateInputType = {
    id?: true
    createdAt?: true
    name?: true
  }

  export type BusinessMaxAggregateInputType = {
    id?: true
    createdAt?: true
    name?: true
  }

  export type BusinessCountAggregateInputType = {
    id?: true
    createdAt?: true
    name?: true
    _all?: true
  }

  export type BusinessAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Business to aggregate.
     */
    where?: BusinessWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Businesses to fetch.
     */
    orderBy?: BusinessOrderByWithRelationInput | BusinessOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BusinessWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Businesses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Businesses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Businesses
    **/
    _count?: true | BusinessCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BusinessMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BusinessMaxAggregateInputType
  }

  export type GetBusinessAggregateType<T extends BusinessAggregateArgs> = {
        [P in keyof T & keyof AggregateBusiness]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBusiness[P]>
      : GetScalarType<T[P], AggregateBusiness[P]>
  }




  export type BusinessGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BusinessWhereInput
    orderBy?: BusinessOrderByWithAggregationInput | BusinessOrderByWithAggregationInput[]
    by: BusinessScalarFieldEnum[] | BusinessScalarFieldEnum
    having?: BusinessScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BusinessCountAggregateInputType | true
    _min?: BusinessMinAggregateInputType
    _max?: BusinessMaxAggregateInputType
  }

  export type BusinessGroupByOutputType = {
    id: string
    createdAt: Date
    name: string
    _count: BusinessCountAggregateOutputType | null
    _min: BusinessMinAggregateOutputType | null
    _max: BusinessMaxAggregateOutputType | null
  }

  type GetBusinessGroupByPayload<T extends BusinessGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BusinessGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BusinessGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BusinessGroupByOutputType[P]>
            : GetScalarType<T[P], BusinessGroupByOutputType[P]>
        }
      >
    >


  export type BusinessSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    name?: boolean
    branches?: boolean | Business$branchesArgs<ExtArgs>
    _count?: boolean | BusinessCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["business"]>

  export type BusinessSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    name?: boolean
  }, ExtArgs["result"]["business"]>

  export type BusinessSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    name?: boolean
  }, ExtArgs["result"]["business"]>

  export type BusinessSelectScalar = {
    id?: boolean
    createdAt?: boolean
    name?: boolean
  }

  export type BusinessOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "name", ExtArgs["result"]["business"]>
  export type BusinessInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    branches?: boolean | Business$branchesArgs<ExtArgs>
    _count?: boolean | BusinessCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type BusinessIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type BusinessIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $BusinessPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Business"
    objects: {
      branches: Prisma.$BranchPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      createdAt: Date
      name: string
    }, ExtArgs["result"]["business"]>
    composites: {}
  }

  type BusinessGetPayload<S extends boolean | null | undefined | BusinessDefaultArgs> = $Result.GetResult<Prisma.$BusinessPayload, S>

  type BusinessCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BusinessFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BusinessCountAggregateInputType | true
    }

  export interface BusinessDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Business'], meta: { name: 'Business' } }
    /**
     * Find zero or one Business that matches the filter.
     * @param {BusinessFindUniqueArgs} args - Arguments to find a Business
     * @example
     * // Get one Business
     * const business = await prisma.business.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BusinessFindUniqueArgs>(args: SelectSubset<T, BusinessFindUniqueArgs<ExtArgs>>): Prisma__BusinessClient<$Result.GetResult<Prisma.$BusinessPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Business that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BusinessFindUniqueOrThrowArgs} args - Arguments to find a Business
     * @example
     * // Get one Business
     * const business = await prisma.business.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BusinessFindUniqueOrThrowArgs>(args: SelectSubset<T, BusinessFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BusinessClient<$Result.GetResult<Prisma.$BusinessPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Business that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BusinessFindFirstArgs} args - Arguments to find a Business
     * @example
     * // Get one Business
     * const business = await prisma.business.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BusinessFindFirstArgs>(args?: SelectSubset<T, BusinessFindFirstArgs<ExtArgs>>): Prisma__BusinessClient<$Result.GetResult<Prisma.$BusinessPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Business that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BusinessFindFirstOrThrowArgs} args - Arguments to find a Business
     * @example
     * // Get one Business
     * const business = await prisma.business.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BusinessFindFirstOrThrowArgs>(args?: SelectSubset<T, BusinessFindFirstOrThrowArgs<ExtArgs>>): Prisma__BusinessClient<$Result.GetResult<Prisma.$BusinessPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Businesses that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BusinessFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Businesses
     * const businesses = await prisma.business.findMany()
     * 
     * // Get first 10 Businesses
     * const businesses = await prisma.business.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const businessWithIdOnly = await prisma.business.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BusinessFindManyArgs>(args?: SelectSubset<T, BusinessFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BusinessPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Business.
     * @param {BusinessCreateArgs} args - Arguments to create a Business.
     * @example
     * // Create one Business
     * const Business = await prisma.business.create({
     *   data: {
     *     // ... data to create a Business
     *   }
     * })
     * 
     */
    create<T extends BusinessCreateArgs>(args: SelectSubset<T, BusinessCreateArgs<ExtArgs>>): Prisma__BusinessClient<$Result.GetResult<Prisma.$BusinessPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Businesses.
     * @param {BusinessCreateManyArgs} args - Arguments to create many Businesses.
     * @example
     * // Create many Businesses
     * const business = await prisma.business.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BusinessCreateManyArgs>(args?: SelectSubset<T, BusinessCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Businesses and returns the data saved in the database.
     * @param {BusinessCreateManyAndReturnArgs} args - Arguments to create many Businesses.
     * @example
     * // Create many Businesses
     * const business = await prisma.business.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Businesses and only return the `id`
     * const businessWithIdOnly = await prisma.business.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BusinessCreateManyAndReturnArgs>(args?: SelectSubset<T, BusinessCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BusinessPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Business.
     * @param {BusinessDeleteArgs} args - Arguments to delete one Business.
     * @example
     * // Delete one Business
     * const Business = await prisma.business.delete({
     *   where: {
     *     // ... filter to delete one Business
     *   }
     * })
     * 
     */
    delete<T extends BusinessDeleteArgs>(args: SelectSubset<T, BusinessDeleteArgs<ExtArgs>>): Prisma__BusinessClient<$Result.GetResult<Prisma.$BusinessPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Business.
     * @param {BusinessUpdateArgs} args - Arguments to update one Business.
     * @example
     * // Update one Business
     * const business = await prisma.business.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BusinessUpdateArgs>(args: SelectSubset<T, BusinessUpdateArgs<ExtArgs>>): Prisma__BusinessClient<$Result.GetResult<Prisma.$BusinessPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Businesses.
     * @param {BusinessDeleteManyArgs} args - Arguments to filter Businesses to delete.
     * @example
     * // Delete a few Businesses
     * const { count } = await prisma.business.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BusinessDeleteManyArgs>(args?: SelectSubset<T, BusinessDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Businesses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BusinessUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Businesses
     * const business = await prisma.business.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BusinessUpdateManyArgs>(args: SelectSubset<T, BusinessUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Businesses and returns the data updated in the database.
     * @param {BusinessUpdateManyAndReturnArgs} args - Arguments to update many Businesses.
     * @example
     * // Update many Businesses
     * const business = await prisma.business.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Businesses and only return the `id`
     * const businessWithIdOnly = await prisma.business.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends BusinessUpdateManyAndReturnArgs>(args: SelectSubset<T, BusinessUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BusinessPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Business.
     * @param {BusinessUpsertArgs} args - Arguments to update or create a Business.
     * @example
     * // Update or create a Business
     * const business = await prisma.business.upsert({
     *   create: {
     *     // ... data to create a Business
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Business we want to update
     *   }
     * })
     */
    upsert<T extends BusinessUpsertArgs>(args: SelectSubset<T, BusinessUpsertArgs<ExtArgs>>): Prisma__BusinessClient<$Result.GetResult<Prisma.$BusinessPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Businesses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BusinessCountArgs} args - Arguments to filter Businesses to count.
     * @example
     * // Count the number of Businesses
     * const count = await prisma.business.count({
     *   where: {
     *     // ... the filter for the Businesses we want to count
     *   }
     * })
    **/
    count<T extends BusinessCountArgs>(
      args?: Subset<T, BusinessCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BusinessCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Business.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BusinessAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BusinessAggregateArgs>(args: Subset<T, BusinessAggregateArgs>): Prisma.PrismaPromise<GetBusinessAggregateType<T>>

    /**
     * Group by Business.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BusinessGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BusinessGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BusinessGroupByArgs['orderBy'] }
        : { orderBy?: BusinessGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BusinessGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBusinessGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Business model
   */
  readonly fields: BusinessFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Business.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BusinessClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    branches<T extends Business$branchesArgs<ExtArgs> = {}>(args?: Subset<T, Business$branchesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BranchPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Business model
   */
  interface BusinessFieldRefs {
    readonly id: FieldRef<"Business", 'String'>
    readonly createdAt: FieldRef<"Business", 'DateTime'>
    readonly name: FieldRef<"Business", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Business findUnique
   */
  export type BusinessFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Business
     */
    select?: BusinessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Business
     */
    omit?: BusinessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BusinessInclude<ExtArgs> | null
    /**
     * Filter, which Business to fetch.
     */
    where: BusinessWhereUniqueInput
  }

  /**
   * Business findUniqueOrThrow
   */
  export type BusinessFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Business
     */
    select?: BusinessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Business
     */
    omit?: BusinessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BusinessInclude<ExtArgs> | null
    /**
     * Filter, which Business to fetch.
     */
    where: BusinessWhereUniqueInput
  }

  /**
   * Business findFirst
   */
  export type BusinessFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Business
     */
    select?: BusinessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Business
     */
    omit?: BusinessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BusinessInclude<ExtArgs> | null
    /**
     * Filter, which Business to fetch.
     */
    where?: BusinessWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Businesses to fetch.
     */
    orderBy?: BusinessOrderByWithRelationInput | BusinessOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Businesses.
     */
    cursor?: BusinessWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Businesses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Businesses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Businesses.
     */
    distinct?: BusinessScalarFieldEnum | BusinessScalarFieldEnum[]
  }

  /**
   * Business findFirstOrThrow
   */
  export type BusinessFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Business
     */
    select?: BusinessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Business
     */
    omit?: BusinessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BusinessInclude<ExtArgs> | null
    /**
     * Filter, which Business to fetch.
     */
    where?: BusinessWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Businesses to fetch.
     */
    orderBy?: BusinessOrderByWithRelationInput | BusinessOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Businesses.
     */
    cursor?: BusinessWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Businesses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Businesses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Businesses.
     */
    distinct?: BusinessScalarFieldEnum | BusinessScalarFieldEnum[]
  }

  /**
   * Business findMany
   */
  export type BusinessFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Business
     */
    select?: BusinessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Business
     */
    omit?: BusinessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BusinessInclude<ExtArgs> | null
    /**
     * Filter, which Businesses to fetch.
     */
    where?: BusinessWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Businesses to fetch.
     */
    orderBy?: BusinessOrderByWithRelationInput | BusinessOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Businesses.
     */
    cursor?: BusinessWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Businesses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Businesses.
     */
    skip?: number
    distinct?: BusinessScalarFieldEnum | BusinessScalarFieldEnum[]
  }

  /**
   * Business create
   */
  export type BusinessCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Business
     */
    select?: BusinessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Business
     */
    omit?: BusinessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BusinessInclude<ExtArgs> | null
    /**
     * The data needed to create a Business.
     */
    data: XOR<BusinessCreateInput, BusinessUncheckedCreateInput>
  }

  /**
   * Business createMany
   */
  export type BusinessCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Businesses.
     */
    data: BusinessCreateManyInput | BusinessCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Business createManyAndReturn
   */
  export type BusinessCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Business
     */
    select?: BusinessSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Business
     */
    omit?: BusinessOmit<ExtArgs> | null
    /**
     * The data used to create many Businesses.
     */
    data: BusinessCreateManyInput | BusinessCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Business update
   */
  export type BusinessUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Business
     */
    select?: BusinessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Business
     */
    omit?: BusinessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BusinessInclude<ExtArgs> | null
    /**
     * The data needed to update a Business.
     */
    data: XOR<BusinessUpdateInput, BusinessUncheckedUpdateInput>
    /**
     * Choose, which Business to update.
     */
    where: BusinessWhereUniqueInput
  }

  /**
   * Business updateMany
   */
  export type BusinessUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Businesses.
     */
    data: XOR<BusinessUpdateManyMutationInput, BusinessUncheckedUpdateManyInput>
    /**
     * Filter which Businesses to update
     */
    where?: BusinessWhereInput
    /**
     * Limit how many Businesses to update.
     */
    limit?: number
  }

  /**
   * Business updateManyAndReturn
   */
  export type BusinessUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Business
     */
    select?: BusinessSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Business
     */
    omit?: BusinessOmit<ExtArgs> | null
    /**
     * The data used to update Businesses.
     */
    data: XOR<BusinessUpdateManyMutationInput, BusinessUncheckedUpdateManyInput>
    /**
     * Filter which Businesses to update
     */
    where?: BusinessWhereInput
    /**
     * Limit how many Businesses to update.
     */
    limit?: number
  }

  /**
   * Business upsert
   */
  export type BusinessUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Business
     */
    select?: BusinessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Business
     */
    omit?: BusinessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BusinessInclude<ExtArgs> | null
    /**
     * The filter to search for the Business to update in case it exists.
     */
    where: BusinessWhereUniqueInput
    /**
     * In case the Business found by the `where` argument doesn't exist, create a new Business with this data.
     */
    create: XOR<BusinessCreateInput, BusinessUncheckedCreateInput>
    /**
     * In case the Business was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BusinessUpdateInput, BusinessUncheckedUpdateInput>
  }

  /**
   * Business delete
   */
  export type BusinessDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Business
     */
    select?: BusinessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Business
     */
    omit?: BusinessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BusinessInclude<ExtArgs> | null
    /**
     * Filter which Business to delete.
     */
    where: BusinessWhereUniqueInput
  }

  /**
   * Business deleteMany
   */
  export type BusinessDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Businesses to delete
     */
    where?: BusinessWhereInput
    /**
     * Limit how many Businesses to delete.
     */
    limit?: number
  }

  /**
   * Business.branches
   */
  export type Business$branchesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Branch
     */
    select?: BranchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Branch
     */
    omit?: BranchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BranchInclude<ExtArgs> | null
    where?: BranchWhereInput
    orderBy?: BranchOrderByWithRelationInput | BranchOrderByWithRelationInput[]
    cursor?: BranchWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BranchScalarFieldEnum | BranchScalarFieldEnum[]
  }

  /**
   * Business without action
   */
  export type BusinessDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Business
     */
    select?: BusinessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Business
     */
    omit?: BusinessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BusinessInclude<ExtArgs> | null
  }


  /**
   * Model Branch
   */

  export type AggregateBranch = {
    _count: BranchCountAggregateOutputType | null
    _min: BranchMinAggregateOutputType | null
    _max: BranchMaxAggregateOutputType | null
  }

  export type BranchMinAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    name: string | null
    addressId: string | null
    businessId: string | null
  }

  export type BranchMaxAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    name: string | null
    addressId: string | null
    businessId: string | null
  }

  export type BranchCountAggregateOutputType = {
    id: number
    createdAt: number
    name: number
    addressId: number
    businessId: number
    _all: number
  }


  export type BranchMinAggregateInputType = {
    id?: true
    createdAt?: true
    name?: true
    addressId?: true
    businessId?: true
  }

  export type BranchMaxAggregateInputType = {
    id?: true
    createdAt?: true
    name?: true
    addressId?: true
    businessId?: true
  }

  export type BranchCountAggregateInputType = {
    id?: true
    createdAt?: true
    name?: true
    addressId?: true
    businessId?: true
    _all?: true
  }

  export type BranchAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Branch to aggregate.
     */
    where?: BranchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Branches to fetch.
     */
    orderBy?: BranchOrderByWithRelationInput | BranchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BranchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Branches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Branches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Branches
    **/
    _count?: true | BranchCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BranchMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BranchMaxAggregateInputType
  }

  export type GetBranchAggregateType<T extends BranchAggregateArgs> = {
        [P in keyof T & keyof AggregateBranch]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBranch[P]>
      : GetScalarType<T[P], AggregateBranch[P]>
  }




  export type BranchGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BranchWhereInput
    orderBy?: BranchOrderByWithAggregationInput | BranchOrderByWithAggregationInput[]
    by: BranchScalarFieldEnum[] | BranchScalarFieldEnum
    having?: BranchScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BranchCountAggregateInputType | true
    _min?: BranchMinAggregateInputType
    _max?: BranchMaxAggregateInputType
  }

  export type BranchGroupByOutputType = {
    id: string
    createdAt: Date
    name: string
    addressId: string | null
    businessId: string | null
    _count: BranchCountAggregateOutputType | null
    _min: BranchMinAggregateOutputType | null
    _max: BranchMaxAggregateOutputType | null
  }

  type GetBranchGroupByPayload<T extends BranchGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BranchGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BranchGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BranchGroupByOutputType[P]>
            : GetScalarType<T[P], BranchGroupByOutputType[P]>
        }
      >
    >


  export type BranchSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    name?: boolean
    addressId?: boolean
    businessId?: boolean
    address?: boolean | Branch$addressArgs<ExtArgs>
    business?: boolean | Branch$businessArgs<ExtArgs>
  }, ExtArgs["result"]["branch"]>

  export type BranchSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    name?: boolean
    addressId?: boolean
    businessId?: boolean
    address?: boolean | Branch$addressArgs<ExtArgs>
    business?: boolean | Branch$businessArgs<ExtArgs>
  }, ExtArgs["result"]["branch"]>

  export type BranchSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    name?: boolean
    addressId?: boolean
    businessId?: boolean
    address?: boolean | Branch$addressArgs<ExtArgs>
    business?: boolean | Branch$businessArgs<ExtArgs>
  }, ExtArgs["result"]["branch"]>

  export type BranchSelectScalar = {
    id?: boolean
    createdAt?: boolean
    name?: boolean
    addressId?: boolean
    businessId?: boolean
  }

  export type BranchOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "name" | "addressId" | "businessId", ExtArgs["result"]["branch"]>
  export type BranchInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    address?: boolean | Branch$addressArgs<ExtArgs>
    business?: boolean | Branch$businessArgs<ExtArgs>
  }
  export type BranchIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    address?: boolean | Branch$addressArgs<ExtArgs>
    business?: boolean | Branch$businessArgs<ExtArgs>
  }
  export type BranchIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    address?: boolean | Branch$addressArgs<ExtArgs>
    business?: boolean | Branch$businessArgs<ExtArgs>
  }

  export type $BranchPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Branch"
    objects: {
      address: Prisma.$AddressPayload<ExtArgs> | null
      business: Prisma.$BusinessPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      createdAt: Date
      name: string
      addressId: string | null
      businessId: string | null
    }, ExtArgs["result"]["branch"]>
    composites: {}
  }

  type BranchGetPayload<S extends boolean | null | undefined | BranchDefaultArgs> = $Result.GetResult<Prisma.$BranchPayload, S>

  type BranchCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BranchFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BranchCountAggregateInputType | true
    }

  export interface BranchDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Branch'], meta: { name: 'Branch' } }
    /**
     * Find zero or one Branch that matches the filter.
     * @param {BranchFindUniqueArgs} args - Arguments to find a Branch
     * @example
     * // Get one Branch
     * const branch = await prisma.branch.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BranchFindUniqueArgs>(args: SelectSubset<T, BranchFindUniqueArgs<ExtArgs>>): Prisma__BranchClient<$Result.GetResult<Prisma.$BranchPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Branch that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BranchFindUniqueOrThrowArgs} args - Arguments to find a Branch
     * @example
     * // Get one Branch
     * const branch = await prisma.branch.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BranchFindUniqueOrThrowArgs>(args: SelectSubset<T, BranchFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BranchClient<$Result.GetResult<Prisma.$BranchPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Branch that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BranchFindFirstArgs} args - Arguments to find a Branch
     * @example
     * // Get one Branch
     * const branch = await prisma.branch.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BranchFindFirstArgs>(args?: SelectSubset<T, BranchFindFirstArgs<ExtArgs>>): Prisma__BranchClient<$Result.GetResult<Prisma.$BranchPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Branch that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BranchFindFirstOrThrowArgs} args - Arguments to find a Branch
     * @example
     * // Get one Branch
     * const branch = await prisma.branch.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BranchFindFirstOrThrowArgs>(args?: SelectSubset<T, BranchFindFirstOrThrowArgs<ExtArgs>>): Prisma__BranchClient<$Result.GetResult<Prisma.$BranchPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Branches that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BranchFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Branches
     * const branches = await prisma.branch.findMany()
     * 
     * // Get first 10 Branches
     * const branches = await prisma.branch.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const branchWithIdOnly = await prisma.branch.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BranchFindManyArgs>(args?: SelectSubset<T, BranchFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BranchPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Branch.
     * @param {BranchCreateArgs} args - Arguments to create a Branch.
     * @example
     * // Create one Branch
     * const Branch = await prisma.branch.create({
     *   data: {
     *     // ... data to create a Branch
     *   }
     * })
     * 
     */
    create<T extends BranchCreateArgs>(args: SelectSubset<T, BranchCreateArgs<ExtArgs>>): Prisma__BranchClient<$Result.GetResult<Prisma.$BranchPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Branches.
     * @param {BranchCreateManyArgs} args - Arguments to create many Branches.
     * @example
     * // Create many Branches
     * const branch = await prisma.branch.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BranchCreateManyArgs>(args?: SelectSubset<T, BranchCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Branches and returns the data saved in the database.
     * @param {BranchCreateManyAndReturnArgs} args - Arguments to create many Branches.
     * @example
     * // Create many Branches
     * const branch = await prisma.branch.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Branches and only return the `id`
     * const branchWithIdOnly = await prisma.branch.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BranchCreateManyAndReturnArgs>(args?: SelectSubset<T, BranchCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BranchPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Branch.
     * @param {BranchDeleteArgs} args - Arguments to delete one Branch.
     * @example
     * // Delete one Branch
     * const Branch = await prisma.branch.delete({
     *   where: {
     *     // ... filter to delete one Branch
     *   }
     * })
     * 
     */
    delete<T extends BranchDeleteArgs>(args: SelectSubset<T, BranchDeleteArgs<ExtArgs>>): Prisma__BranchClient<$Result.GetResult<Prisma.$BranchPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Branch.
     * @param {BranchUpdateArgs} args - Arguments to update one Branch.
     * @example
     * // Update one Branch
     * const branch = await prisma.branch.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BranchUpdateArgs>(args: SelectSubset<T, BranchUpdateArgs<ExtArgs>>): Prisma__BranchClient<$Result.GetResult<Prisma.$BranchPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Branches.
     * @param {BranchDeleteManyArgs} args - Arguments to filter Branches to delete.
     * @example
     * // Delete a few Branches
     * const { count } = await prisma.branch.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BranchDeleteManyArgs>(args?: SelectSubset<T, BranchDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Branches.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BranchUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Branches
     * const branch = await prisma.branch.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BranchUpdateManyArgs>(args: SelectSubset<T, BranchUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Branches and returns the data updated in the database.
     * @param {BranchUpdateManyAndReturnArgs} args - Arguments to update many Branches.
     * @example
     * // Update many Branches
     * const branch = await prisma.branch.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Branches and only return the `id`
     * const branchWithIdOnly = await prisma.branch.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends BranchUpdateManyAndReturnArgs>(args: SelectSubset<T, BranchUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BranchPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Branch.
     * @param {BranchUpsertArgs} args - Arguments to update or create a Branch.
     * @example
     * // Update or create a Branch
     * const branch = await prisma.branch.upsert({
     *   create: {
     *     // ... data to create a Branch
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Branch we want to update
     *   }
     * })
     */
    upsert<T extends BranchUpsertArgs>(args: SelectSubset<T, BranchUpsertArgs<ExtArgs>>): Prisma__BranchClient<$Result.GetResult<Prisma.$BranchPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Branches.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BranchCountArgs} args - Arguments to filter Branches to count.
     * @example
     * // Count the number of Branches
     * const count = await prisma.branch.count({
     *   where: {
     *     // ... the filter for the Branches we want to count
     *   }
     * })
    **/
    count<T extends BranchCountArgs>(
      args?: Subset<T, BranchCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BranchCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Branch.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BranchAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BranchAggregateArgs>(args: Subset<T, BranchAggregateArgs>): Prisma.PrismaPromise<GetBranchAggregateType<T>>

    /**
     * Group by Branch.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BranchGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BranchGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BranchGroupByArgs['orderBy'] }
        : { orderBy?: BranchGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BranchGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBranchGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Branch model
   */
  readonly fields: BranchFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Branch.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BranchClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    address<T extends Branch$addressArgs<ExtArgs> = {}>(args?: Subset<T, Branch$addressArgs<ExtArgs>>): Prisma__AddressClient<$Result.GetResult<Prisma.$AddressPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    business<T extends Branch$businessArgs<ExtArgs> = {}>(args?: Subset<T, Branch$businessArgs<ExtArgs>>): Prisma__BusinessClient<$Result.GetResult<Prisma.$BusinessPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Branch model
   */
  interface BranchFieldRefs {
    readonly id: FieldRef<"Branch", 'String'>
    readonly createdAt: FieldRef<"Branch", 'DateTime'>
    readonly name: FieldRef<"Branch", 'String'>
    readonly addressId: FieldRef<"Branch", 'String'>
    readonly businessId: FieldRef<"Branch", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Branch findUnique
   */
  export type BranchFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Branch
     */
    select?: BranchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Branch
     */
    omit?: BranchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BranchInclude<ExtArgs> | null
    /**
     * Filter, which Branch to fetch.
     */
    where: BranchWhereUniqueInput
  }

  /**
   * Branch findUniqueOrThrow
   */
  export type BranchFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Branch
     */
    select?: BranchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Branch
     */
    omit?: BranchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BranchInclude<ExtArgs> | null
    /**
     * Filter, which Branch to fetch.
     */
    where: BranchWhereUniqueInput
  }

  /**
   * Branch findFirst
   */
  export type BranchFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Branch
     */
    select?: BranchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Branch
     */
    omit?: BranchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BranchInclude<ExtArgs> | null
    /**
     * Filter, which Branch to fetch.
     */
    where?: BranchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Branches to fetch.
     */
    orderBy?: BranchOrderByWithRelationInput | BranchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Branches.
     */
    cursor?: BranchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Branches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Branches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Branches.
     */
    distinct?: BranchScalarFieldEnum | BranchScalarFieldEnum[]
  }

  /**
   * Branch findFirstOrThrow
   */
  export type BranchFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Branch
     */
    select?: BranchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Branch
     */
    omit?: BranchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BranchInclude<ExtArgs> | null
    /**
     * Filter, which Branch to fetch.
     */
    where?: BranchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Branches to fetch.
     */
    orderBy?: BranchOrderByWithRelationInput | BranchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Branches.
     */
    cursor?: BranchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Branches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Branches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Branches.
     */
    distinct?: BranchScalarFieldEnum | BranchScalarFieldEnum[]
  }

  /**
   * Branch findMany
   */
  export type BranchFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Branch
     */
    select?: BranchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Branch
     */
    omit?: BranchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BranchInclude<ExtArgs> | null
    /**
     * Filter, which Branches to fetch.
     */
    where?: BranchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Branches to fetch.
     */
    orderBy?: BranchOrderByWithRelationInput | BranchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Branches.
     */
    cursor?: BranchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Branches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Branches.
     */
    skip?: number
    distinct?: BranchScalarFieldEnum | BranchScalarFieldEnum[]
  }

  /**
   * Branch create
   */
  export type BranchCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Branch
     */
    select?: BranchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Branch
     */
    omit?: BranchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BranchInclude<ExtArgs> | null
    /**
     * The data needed to create a Branch.
     */
    data: XOR<BranchCreateInput, BranchUncheckedCreateInput>
  }

  /**
   * Branch createMany
   */
  export type BranchCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Branches.
     */
    data: BranchCreateManyInput | BranchCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Branch createManyAndReturn
   */
  export type BranchCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Branch
     */
    select?: BranchSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Branch
     */
    omit?: BranchOmit<ExtArgs> | null
    /**
     * The data used to create many Branches.
     */
    data: BranchCreateManyInput | BranchCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BranchIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Branch update
   */
  export type BranchUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Branch
     */
    select?: BranchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Branch
     */
    omit?: BranchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BranchInclude<ExtArgs> | null
    /**
     * The data needed to update a Branch.
     */
    data: XOR<BranchUpdateInput, BranchUncheckedUpdateInput>
    /**
     * Choose, which Branch to update.
     */
    where: BranchWhereUniqueInput
  }

  /**
   * Branch updateMany
   */
  export type BranchUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Branches.
     */
    data: XOR<BranchUpdateManyMutationInput, BranchUncheckedUpdateManyInput>
    /**
     * Filter which Branches to update
     */
    where?: BranchWhereInput
    /**
     * Limit how many Branches to update.
     */
    limit?: number
  }

  /**
   * Branch updateManyAndReturn
   */
  export type BranchUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Branch
     */
    select?: BranchSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Branch
     */
    omit?: BranchOmit<ExtArgs> | null
    /**
     * The data used to update Branches.
     */
    data: XOR<BranchUpdateManyMutationInput, BranchUncheckedUpdateManyInput>
    /**
     * Filter which Branches to update
     */
    where?: BranchWhereInput
    /**
     * Limit how many Branches to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BranchIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Branch upsert
   */
  export type BranchUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Branch
     */
    select?: BranchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Branch
     */
    omit?: BranchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BranchInclude<ExtArgs> | null
    /**
     * The filter to search for the Branch to update in case it exists.
     */
    where: BranchWhereUniqueInput
    /**
     * In case the Branch found by the `where` argument doesn't exist, create a new Branch with this data.
     */
    create: XOR<BranchCreateInput, BranchUncheckedCreateInput>
    /**
     * In case the Branch was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BranchUpdateInput, BranchUncheckedUpdateInput>
  }

  /**
   * Branch delete
   */
  export type BranchDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Branch
     */
    select?: BranchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Branch
     */
    omit?: BranchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BranchInclude<ExtArgs> | null
    /**
     * Filter which Branch to delete.
     */
    where: BranchWhereUniqueInput
  }

  /**
   * Branch deleteMany
   */
  export type BranchDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Branches to delete
     */
    where?: BranchWhereInput
    /**
     * Limit how many Branches to delete.
     */
    limit?: number
  }

  /**
   * Branch.address
   */
  export type Branch$addressArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Address
     */
    select?: AddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Address
     */
    omit?: AddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AddressInclude<ExtArgs> | null
    where?: AddressWhereInput
  }

  /**
   * Branch.business
   */
  export type Branch$businessArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Business
     */
    select?: BusinessSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Business
     */
    omit?: BusinessOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BusinessInclude<ExtArgs> | null
    where?: BusinessWhereInput
  }

  /**
   * Branch without action
   */
  export type BranchDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Branch
     */
    select?: BranchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Branch
     */
    omit?: BranchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BranchInclude<ExtArgs> | null
  }


  /**
   * Model Address
   */

  export type AggregateAddress = {
    _count: AddressCountAggregateOutputType | null
    _min: AddressMinAggregateOutputType | null
    _max: AddressMaxAggregateOutputType | null
  }

  export type AddressMinAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    description: string | null
    googleMapsUrl: string | null
  }

  export type AddressMaxAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    description: string | null
    googleMapsUrl: string | null
  }

  export type AddressCountAggregateOutputType = {
    id: number
    createdAt: number
    description: number
    googleMapsUrl: number
    _all: number
  }


  export type AddressMinAggregateInputType = {
    id?: true
    createdAt?: true
    description?: true
    googleMapsUrl?: true
  }

  export type AddressMaxAggregateInputType = {
    id?: true
    createdAt?: true
    description?: true
    googleMapsUrl?: true
  }

  export type AddressCountAggregateInputType = {
    id?: true
    createdAt?: true
    description?: true
    googleMapsUrl?: true
    _all?: true
  }

  export type AddressAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Address to aggregate.
     */
    where?: AddressWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Addresses to fetch.
     */
    orderBy?: AddressOrderByWithRelationInput | AddressOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AddressWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Addresses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Addresses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Addresses
    **/
    _count?: true | AddressCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AddressMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AddressMaxAggregateInputType
  }

  export type GetAddressAggregateType<T extends AddressAggregateArgs> = {
        [P in keyof T & keyof AggregateAddress]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAddress[P]>
      : GetScalarType<T[P], AggregateAddress[P]>
  }




  export type AddressGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AddressWhereInput
    orderBy?: AddressOrderByWithAggregationInput | AddressOrderByWithAggregationInput[]
    by: AddressScalarFieldEnum[] | AddressScalarFieldEnum
    having?: AddressScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AddressCountAggregateInputType | true
    _min?: AddressMinAggregateInputType
    _max?: AddressMaxAggregateInputType
  }

  export type AddressGroupByOutputType = {
    id: string
    createdAt: Date
    description: string
    googleMapsUrl: string
    _count: AddressCountAggregateOutputType | null
    _min: AddressMinAggregateOutputType | null
    _max: AddressMaxAggregateOutputType | null
  }

  type GetAddressGroupByPayload<T extends AddressGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AddressGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AddressGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AddressGroupByOutputType[P]>
            : GetScalarType<T[P], AddressGroupByOutputType[P]>
        }
      >
    >


  export type AddressSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    description?: boolean
    googleMapsUrl?: boolean
    branch?: boolean | Address$branchArgs<ExtArgs>
    orders?: boolean | Address$ordersArgs<ExtArgs>
    _count?: boolean | AddressCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["address"]>

  export type AddressSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    description?: boolean
    googleMapsUrl?: boolean
  }, ExtArgs["result"]["address"]>

  export type AddressSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    description?: boolean
    googleMapsUrl?: boolean
  }, ExtArgs["result"]["address"]>

  export type AddressSelectScalar = {
    id?: boolean
    createdAt?: boolean
    description?: boolean
    googleMapsUrl?: boolean
  }

  export type AddressOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "description" | "googleMapsUrl", ExtArgs["result"]["address"]>
  export type AddressInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    branch?: boolean | Address$branchArgs<ExtArgs>
    orders?: boolean | Address$ordersArgs<ExtArgs>
    _count?: boolean | AddressCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type AddressIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type AddressIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $AddressPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Address"
    objects: {
      branch: Prisma.$BranchPayload<ExtArgs> | null
      orders: Prisma.$OrderPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      createdAt: Date
      description: string
      googleMapsUrl: string
    }, ExtArgs["result"]["address"]>
    composites: {}
  }

  type AddressGetPayload<S extends boolean | null | undefined | AddressDefaultArgs> = $Result.GetResult<Prisma.$AddressPayload, S>

  type AddressCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AddressFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AddressCountAggregateInputType | true
    }

  export interface AddressDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Address'], meta: { name: 'Address' } }
    /**
     * Find zero or one Address that matches the filter.
     * @param {AddressFindUniqueArgs} args - Arguments to find a Address
     * @example
     * // Get one Address
     * const address = await prisma.address.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AddressFindUniqueArgs>(args: SelectSubset<T, AddressFindUniqueArgs<ExtArgs>>): Prisma__AddressClient<$Result.GetResult<Prisma.$AddressPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Address that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AddressFindUniqueOrThrowArgs} args - Arguments to find a Address
     * @example
     * // Get one Address
     * const address = await prisma.address.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AddressFindUniqueOrThrowArgs>(args: SelectSubset<T, AddressFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AddressClient<$Result.GetResult<Prisma.$AddressPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Address that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AddressFindFirstArgs} args - Arguments to find a Address
     * @example
     * // Get one Address
     * const address = await prisma.address.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AddressFindFirstArgs>(args?: SelectSubset<T, AddressFindFirstArgs<ExtArgs>>): Prisma__AddressClient<$Result.GetResult<Prisma.$AddressPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Address that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AddressFindFirstOrThrowArgs} args - Arguments to find a Address
     * @example
     * // Get one Address
     * const address = await prisma.address.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AddressFindFirstOrThrowArgs>(args?: SelectSubset<T, AddressFindFirstOrThrowArgs<ExtArgs>>): Prisma__AddressClient<$Result.GetResult<Prisma.$AddressPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Addresses that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AddressFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Addresses
     * const addresses = await prisma.address.findMany()
     * 
     * // Get first 10 Addresses
     * const addresses = await prisma.address.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const addressWithIdOnly = await prisma.address.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AddressFindManyArgs>(args?: SelectSubset<T, AddressFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AddressPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Address.
     * @param {AddressCreateArgs} args - Arguments to create a Address.
     * @example
     * // Create one Address
     * const Address = await prisma.address.create({
     *   data: {
     *     // ... data to create a Address
     *   }
     * })
     * 
     */
    create<T extends AddressCreateArgs>(args: SelectSubset<T, AddressCreateArgs<ExtArgs>>): Prisma__AddressClient<$Result.GetResult<Prisma.$AddressPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Addresses.
     * @param {AddressCreateManyArgs} args - Arguments to create many Addresses.
     * @example
     * // Create many Addresses
     * const address = await prisma.address.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AddressCreateManyArgs>(args?: SelectSubset<T, AddressCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Addresses and returns the data saved in the database.
     * @param {AddressCreateManyAndReturnArgs} args - Arguments to create many Addresses.
     * @example
     * // Create many Addresses
     * const address = await prisma.address.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Addresses and only return the `id`
     * const addressWithIdOnly = await prisma.address.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AddressCreateManyAndReturnArgs>(args?: SelectSubset<T, AddressCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AddressPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Address.
     * @param {AddressDeleteArgs} args - Arguments to delete one Address.
     * @example
     * // Delete one Address
     * const Address = await prisma.address.delete({
     *   where: {
     *     // ... filter to delete one Address
     *   }
     * })
     * 
     */
    delete<T extends AddressDeleteArgs>(args: SelectSubset<T, AddressDeleteArgs<ExtArgs>>): Prisma__AddressClient<$Result.GetResult<Prisma.$AddressPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Address.
     * @param {AddressUpdateArgs} args - Arguments to update one Address.
     * @example
     * // Update one Address
     * const address = await prisma.address.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AddressUpdateArgs>(args: SelectSubset<T, AddressUpdateArgs<ExtArgs>>): Prisma__AddressClient<$Result.GetResult<Prisma.$AddressPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Addresses.
     * @param {AddressDeleteManyArgs} args - Arguments to filter Addresses to delete.
     * @example
     * // Delete a few Addresses
     * const { count } = await prisma.address.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AddressDeleteManyArgs>(args?: SelectSubset<T, AddressDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Addresses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AddressUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Addresses
     * const address = await prisma.address.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AddressUpdateManyArgs>(args: SelectSubset<T, AddressUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Addresses and returns the data updated in the database.
     * @param {AddressUpdateManyAndReturnArgs} args - Arguments to update many Addresses.
     * @example
     * // Update many Addresses
     * const address = await prisma.address.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Addresses and only return the `id`
     * const addressWithIdOnly = await prisma.address.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AddressUpdateManyAndReturnArgs>(args: SelectSubset<T, AddressUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AddressPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Address.
     * @param {AddressUpsertArgs} args - Arguments to update or create a Address.
     * @example
     * // Update or create a Address
     * const address = await prisma.address.upsert({
     *   create: {
     *     // ... data to create a Address
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Address we want to update
     *   }
     * })
     */
    upsert<T extends AddressUpsertArgs>(args: SelectSubset<T, AddressUpsertArgs<ExtArgs>>): Prisma__AddressClient<$Result.GetResult<Prisma.$AddressPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Addresses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AddressCountArgs} args - Arguments to filter Addresses to count.
     * @example
     * // Count the number of Addresses
     * const count = await prisma.address.count({
     *   where: {
     *     // ... the filter for the Addresses we want to count
     *   }
     * })
    **/
    count<T extends AddressCountArgs>(
      args?: Subset<T, AddressCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AddressCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Address.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AddressAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AddressAggregateArgs>(args: Subset<T, AddressAggregateArgs>): Prisma.PrismaPromise<GetAddressAggregateType<T>>

    /**
     * Group by Address.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AddressGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AddressGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AddressGroupByArgs['orderBy'] }
        : { orderBy?: AddressGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AddressGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAddressGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Address model
   */
  readonly fields: AddressFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Address.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AddressClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    branch<T extends Address$branchArgs<ExtArgs> = {}>(args?: Subset<T, Address$branchArgs<ExtArgs>>): Prisma__BranchClient<$Result.GetResult<Prisma.$BranchPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    orders<T extends Address$ordersArgs<ExtArgs> = {}>(args?: Subset<T, Address$ordersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Address model
   */
  interface AddressFieldRefs {
    readonly id: FieldRef<"Address", 'String'>
    readonly createdAt: FieldRef<"Address", 'DateTime'>
    readonly description: FieldRef<"Address", 'String'>
    readonly googleMapsUrl: FieldRef<"Address", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Address findUnique
   */
  export type AddressFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Address
     */
    select?: AddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Address
     */
    omit?: AddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AddressInclude<ExtArgs> | null
    /**
     * Filter, which Address to fetch.
     */
    where: AddressWhereUniqueInput
  }

  /**
   * Address findUniqueOrThrow
   */
  export type AddressFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Address
     */
    select?: AddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Address
     */
    omit?: AddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AddressInclude<ExtArgs> | null
    /**
     * Filter, which Address to fetch.
     */
    where: AddressWhereUniqueInput
  }

  /**
   * Address findFirst
   */
  export type AddressFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Address
     */
    select?: AddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Address
     */
    omit?: AddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AddressInclude<ExtArgs> | null
    /**
     * Filter, which Address to fetch.
     */
    where?: AddressWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Addresses to fetch.
     */
    orderBy?: AddressOrderByWithRelationInput | AddressOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Addresses.
     */
    cursor?: AddressWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Addresses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Addresses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Addresses.
     */
    distinct?: AddressScalarFieldEnum | AddressScalarFieldEnum[]
  }

  /**
   * Address findFirstOrThrow
   */
  export type AddressFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Address
     */
    select?: AddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Address
     */
    omit?: AddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AddressInclude<ExtArgs> | null
    /**
     * Filter, which Address to fetch.
     */
    where?: AddressWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Addresses to fetch.
     */
    orderBy?: AddressOrderByWithRelationInput | AddressOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Addresses.
     */
    cursor?: AddressWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Addresses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Addresses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Addresses.
     */
    distinct?: AddressScalarFieldEnum | AddressScalarFieldEnum[]
  }

  /**
   * Address findMany
   */
  export type AddressFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Address
     */
    select?: AddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Address
     */
    omit?: AddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AddressInclude<ExtArgs> | null
    /**
     * Filter, which Addresses to fetch.
     */
    where?: AddressWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Addresses to fetch.
     */
    orderBy?: AddressOrderByWithRelationInput | AddressOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Addresses.
     */
    cursor?: AddressWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Addresses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Addresses.
     */
    skip?: number
    distinct?: AddressScalarFieldEnum | AddressScalarFieldEnum[]
  }

  /**
   * Address create
   */
  export type AddressCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Address
     */
    select?: AddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Address
     */
    omit?: AddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AddressInclude<ExtArgs> | null
    /**
     * The data needed to create a Address.
     */
    data: XOR<AddressCreateInput, AddressUncheckedCreateInput>
  }

  /**
   * Address createMany
   */
  export type AddressCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Addresses.
     */
    data: AddressCreateManyInput | AddressCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Address createManyAndReturn
   */
  export type AddressCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Address
     */
    select?: AddressSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Address
     */
    omit?: AddressOmit<ExtArgs> | null
    /**
     * The data used to create many Addresses.
     */
    data: AddressCreateManyInput | AddressCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Address update
   */
  export type AddressUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Address
     */
    select?: AddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Address
     */
    omit?: AddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AddressInclude<ExtArgs> | null
    /**
     * The data needed to update a Address.
     */
    data: XOR<AddressUpdateInput, AddressUncheckedUpdateInput>
    /**
     * Choose, which Address to update.
     */
    where: AddressWhereUniqueInput
  }

  /**
   * Address updateMany
   */
  export type AddressUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Addresses.
     */
    data: XOR<AddressUpdateManyMutationInput, AddressUncheckedUpdateManyInput>
    /**
     * Filter which Addresses to update
     */
    where?: AddressWhereInput
    /**
     * Limit how many Addresses to update.
     */
    limit?: number
  }

  /**
   * Address updateManyAndReturn
   */
  export type AddressUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Address
     */
    select?: AddressSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Address
     */
    omit?: AddressOmit<ExtArgs> | null
    /**
     * The data used to update Addresses.
     */
    data: XOR<AddressUpdateManyMutationInput, AddressUncheckedUpdateManyInput>
    /**
     * Filter which Addresses to update
     */
    where?: AddressWhereInput
    /**
     * Limit how many Addresses to update.
     */
    limit?: number
  }

  /**
   * Address upsert
   */
  export type AddressUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Address
     */
    select?: AddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Address
     */
    omit?: AddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AddressInclude<ExtArgs> | null
    /**
     * The filter to search for the Address to update in case it exists.
     */
    where: AddressWhereUniqueInput
    /**
     * In case the Address found by the `where` argument doesn't exist, create a new Address with this data.
     */
    create: XOR<AddressCreateInput, AddressUncheckedCreateInput>
    /**
     * In case the Address was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AddressUpdateInput, AddressUncheckedUpdateInput>
  }

  /**
   * Address delete
   */
  export type AddressDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Address
     */
    select?: AddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Address
     */
    omit?: AddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AddressInclude<ExtArgs> | null
    /**
     * Filter which Address to delete.
     */
    where: AddressWhereUniqueInput
  }

  /**
   * Address deleteMany
   */
  export type AddressDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Addresses to delete
     */
    where?: AddressWhereInput
    /**
     * Limit how many Addresses to delete.
     */
    limit?: number
  }

  /**
   * Address.branch
   */
  export type Address$branchArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Branch
     */
    select?: BranchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Branch
     */
    omit?: BranchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BranchInclude<ExtArgs> | null
    where?: BranchWhereInput
  }

  /**
   * Address.orders
   */
  export type Address$ordersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    where?: OrderWhereInput
    orderBy?: OrderOrderByWithRelationInput | OrderOrderByWithRelationInput[]
    cursor?: OrderWhereUniqueInput
    take?: number
    skip?: number
    distinct?: OrderScalarFieldEnum | OrderScalarFieldEnum[]
  }

  /**
   * Address without action
   */
  export type AddressDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Address
     */
    select?: AddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Address
     */
    omit?: AddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AddressInclude<ExtArgs> | null
  }


  /**
   * Model Product
   */

  export type AggregateProduct = {
    _count: ProductCountAggregateOutputType | null
    _avg: ProductAvgAggregateOutputType | null
    _sum: ProductSumAggregateOutputType | null
    _min: ProductMinAggregateOutputType | null
    _max: ProductMaxAggregateOutputType | null
  }

  export type ProductAvgAggregateOutputType = {
    price: number | null
    comparedAtPrice: number | null
  }

  export type ProductSumAggregateOutputType = {
    price: number | null
    comparedAtPrice: number | null
  }

  export type ProductMinAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    name: string | null
    description: string | null
    price: number | null
    comparedAtPrice: number | null
    categoryId: string | null
  }

  export type ProductMaxAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    name: string | null
    description: string | null
    price: number | null
    comparedAtPrice: number | null
    categoryId: string | null
  }

  export type ProductCountAggregateOutputType = {
    id: number
    createdAt: number
    name: number
    description: number
    price: number
    comparedAtPrice: number
    categoryId: number
    _all: number
  }


  export type ProductAvgAggregateInputType = {
    price?: true
    comparedAtPrice?: true
  }

  export type ProductSumAggregateInputType = {
    price?: true
    comparedAtPrice?: true
  }

  export type ProductMinAggregateInputType = {
    id?: true
    createdAt?: true
    name?: true
    description?: true
    price?: true
    comparedAtPrice?: true
    categoryId?: true
  }

  export type ProductMaxAggregateInputType = {
    id?: true
    createdAt?: true
    name?: true
    description?: true
    price?: true
    comparedAtPrice?: true
    categoryId?: true
  }

  export type ProductCountAggregateInputType = {
    id?: true
    createdAt?: true
    name?: true
    description?: true
    price?: true
    comparedAtPrice?: true
    categoryId?: true
    _all?: true
  }

  export type ProductAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Product to aggregate.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Products
    **/
    _count?: true | ProductCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ProductAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ProductSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProductMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProductMaxAggregateInputType
  }

  export type GetProductAggregateType<T extends ProductAggregateArgs> = {
        [P in keyof T & keyof AggregateProduct]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProduct[P]>
      : GetScalarType<T[P], AggregateProduct[P]>
  }




  export type ProductGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProductWhereInput
    orderBy?: ProductOrderByWithAggregationInput | ProductOrderByWithAggregationInput[]
    by: ProductScalarFieldEnum[] | ProductScalarFieldEnum
    having?: ProductScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProductCountAggregateInputType | true
    _avg?: ProductAvgAggregateInputType
    _sum?: ProductSumAggregateInputType
    _min?: ProductMinAggregateInputType
    _max?: ProductMaxAggregateInputType
  }

  export type ProductGroupByOutputType = {
    id: string
    createdAt: Date
    name: string
    description: string | null
    price: number | null
    comparedAtPrice: number | null
    categoryId: string | null
    _count: ProductCountAggregateOutputType | null
    _avg: ProductAvgAggregateOutputType | null
    _sum: ProductSumAggregateOutputType | null
    _min: ProductMinAggregateOutputType | null
    _max: ProductMaxAggregateOutputType | null
  }

  type GetProductGroupByPayload<T extends ProductGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProductGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProductGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProductGroupByOutputType[P]>
            : GetScalarType<T[P], ProductGroupByOutputType[P]>
        }
      >
    >


  export type ProductSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    name?: boolean
    description?: boolean
    price?: boolean
    comparedAtPrice?: boolean
    categoryId?: boolean
    photos?: boolean | Product$photosArgs<ExtArgs>
    modifierGroups?: boolean | Product$modifierGroupsArgs<ExtArgs>
    category?: boolean | Product$categoryArgs<ExtArgs>
    OrderProducts?: boolean | Product$OrderProductsArgs<ExtArgs>
    _count?: boolean | ProductCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["product"]>

  export type ProductSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    name?: boolean
    description?: boolean
    price?: boolean
    comparedAtPrice?: boolean
    categoryId?: boolean
    category?: boolean | Product$categoryArgs<ExtArgs>
  }, ExtArgs["result"]["product"]>

  export type ProductSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    name?: boolean
    description?: boolean
    price?: boolean
    comparedAtPrice?: boolean
    categoryId?: boolean
    category?: boolean | Product$categoryArgs<ExtArgs>
  }, ExtArgs["result"]["product"]>

  export type ProductSelectScalar = {
    id?: boolean
    createdAt?: boolean
    name?: boolean
    description?: boolean
    price?: boolean
    comparedAtPrice?: boolean
    categoryId?: boolean
  }

  export type ProductOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "name" | "description" | "price" | "comparedAtPrice" | "categoryId", ExtArgs["result"]["product"]>
  export type ProductInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    photos?: boolean | Product$photosArgs<ExtArgs>
    modifierGroups?: boolean | Product$modifierGroupsArgs<ExtArgs>
    category?: boolean | Product$categoryArgs<ExtArgs>
    OrderProducts?: boolean | Product$OrderProductsArgs<ExtArgs>
    _count?: boolean | ProductCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ProductIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    category?: boolean | Product$categoryArgs<ExtArgs>
  }
  export type ProductIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    category?: boolean | Product$categoryArgs<ExtArgs>
  }

  export type $ProductPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Product"
    objects: {
      photos: Prisma.$FilePayload<ExtArgs>[]
      modifierGroups: Prisma.$ModifierGroupPayload<ExtArgs>[]
      category: Prisma.$CategoryPayload<ExtArgs> | null
      OrderProducts: Prisma.$OrderProductsPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      createdAt: Date
      name: string
      description: string | null
      price: number | null
      comparedAtPrice: number | null
      categoryId: string | null
    }, ExtArgs["result"]["product"]>
    composites: {}
  }

  type ProductGetPayload<S extends boolean | null | undefined | ProductDefaultArgs> = $Result.GetResult<Prisma.$ProductPayload, S>

  type ProductCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ProductFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ProductCountAggregateInputType | true
    }

  export interface ProductDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Product'], meta: { name: 'Product' } }
    /**
     * Find zero or one Product that matches the filter.
     * @param {ProductFindUniqueArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProductFindUniqueArgs>(args: SelectSubset<T, ProductFindUniqueArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Product that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProductFindUniqueOrThrowArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProductFindUniqueOrThrowArgs>(args: SelectSubset<T, ProductFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Product that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductFindFirstArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProductFindFirstArgs>(args?: SelectSubset<T, ProductFindFirstArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Product that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductFindFirstOrThrowArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProductFindFirstOrThrowArgs>(args?: SelectSubset<T, ProductFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Products that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Products
     * const products = await prisma.product.findMany()
     * 
     * // Get first 10 Products
     * const products = await prisma.product.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const productWithIdOnly = await prisma.product.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProductFindManyArgs>(args?: SelectSubset<T, ProductFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Product.
     * @param {ProductCreateArgs} args - Arguments to create a Product.
     * @example
     * // Create one Product
     * const Product = await prisma.product.create({
     *   data: {
     *     // ... data to create a Product
     *   }
     * })
     * 
     */
    create<T extends ProductCreateArgs>(args: SelectSubset<T, ProductCreateArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Products.
     * @param {ProductCreateManyArgs} args - Arguments to create many Products.
     * @example
     * // Create many Products
     * const product = await prisma.product.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProductCreateManyArgs>(args?: SelectSubset<T, ProductCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Products and returns the data saved in the database.
     * @param {ProductCreateManyAndReturnArgs} args - Arguments to create many Products.
     * @example
     * // Create many Products
     * const product = await prisma.product.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Products and only return the `id`
     * const productWithIdOnly = await prisma.product.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProductCreateManyAndReturnArgs>(args?: SelectSubset<T, ProductCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Product.
     * @param {ProductDeleteArgs} args - Arguments to delete one Product.
     * @example
     * // Delete one Product
     * const Product = await prisma.product.delete({
     *   where: {
     *     // ... filter to delete one Product
     *   }
     * })
     * 
     */
    delete<T extends ProductDeleteArgs>(args: SelectSubset<T, ProductDeleteArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Product.
     * @param {ProductUpdateArgs} args - Arguments to update one Product.
     * @example
     * // Update one Product
     * const product = await prisma.product.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProductUpdateArgs>(args: SelectSubset<T, ProductUpdateArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Products.
     * @param {ProductDeleteManyArgs} args - Arguments to filter Products to delete.
     * @example
     * // Delete a few Products
     * const { count } = await prisma.product.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProductDeleteManyArgs>(args?: SelectSubset<T, ProductDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Products.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Products
     * const product = await prisma.product.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProductUpdateManyArgs>(args: SelectSubset<T, ProductUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Products and returns the data updated in the database.
     * @param {ProductUpdateManyAndReturnArgs} args - Arguments to update many Products.
     * @example
     * // Update many Products
     * const product = await prisma.product.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Products and only return the `id`
     * const productWithIdOnly = await prisma.product.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ProductUpdateManyAndReturnArgs>(args: SelectSubset<T, ProductUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Product.
     * @param {ProductUpsertArgs} args - Arguments to update or create a Product.
     * @example
     * // Update or create a Product
     * const product = await prisma.product.upsert({
     *   create: {
     *     // ... data to create a Product
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Product we want to update
     *   }
     * })
     */
    upsert<T extends ProductUpsertArgs>(args: SelectSubset<T, ProductUpsertArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Products.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductCountArgs} args - Arguments to filter Products to count.
     * @example
     * // Count the number of Products
     * const count = await prisma.product.count({
     *   where: {
     *     // ... the filter for the Products we want to count
     *   }
     * })
    **/
    count<T extends ProductCountArgs>(
      args?: Subset<T, ProductCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProductCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Product.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProductAggregateArgs>(args: Subset<T, ProductAggregateArgs>): Prisma.PrismaPromise<GetProductAggregateType<T>>

    /**
     * Group by Product.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProductGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProductGroupByArgs['orderBy'] }
        : { orderBy?: ProductGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProductGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProductGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Product model
   */
  readonly fields: ProductFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Product.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProductClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    photos<T extends Product$photosArgs<ExtArgs> = {}>(args?: Subset<T, Product$photosArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    modifierGroups<T extends Product$modifierGroupsArgs<ExtArgs> = {}>(args?: Subset<T, Product$modifierGroupsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModifierGroupPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    category<T extends Product$categoryArgs<ExtArgs> = {}>(args?: Subset<T, Product$categoryArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    OrderProducts<T extends Product$OrderProductsArgs<ExtArgs> = {}>(args?: Subset<T, Product$OrderProductsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrderProductsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Product model
   */
  interface ProductFieldRefs {
    readonly id: FieldRef<"Product", 'String'>
    readonly createdAt: FieldRef<"Product", 'DateTime'>
    readonly name: FieldRef<"Product", 'String'>
    readonly description: FieldRef<"Product", 'String'>
    readonly price: FieldRef<"Product", 'Int'>
    readonly comparedAtPrice: FieldRef<"Product", 'Int'>
    readonly categoryId: FieldRef<"Product", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Product findUnique
   */
  export type ProductFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product findUniqueOrThrow
   */
  export type ProductFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product findFirst
   */
  export type ProductFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Products.
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Products.
     */
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Product findFirstOrThrow
   */
  export type ProductFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Products.
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Products.
     */
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Product findMany
   */
  export type ProductFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Products to fetch.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Products.
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Product create
   */
  export type ProductCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * The data needed to create a Product.
     */
    data: XOR<ProductCreateInput, ProductUncheckedCreateInput>
  }

  /**
   * Product createMany
   */
  export type ProductCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Products.
     */
    data: ProductCreateManyInput | ProductCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Product createManyAndReturn
   */
  export type ProductCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * The data used to create many Products.
     */
    data: ProductCreateManyInput | ProductCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Product update
   */
  export type ProductUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * The data needed to update a Product.
     */
    data: XOR<ProductUpdateInput, ProductUncheckedUpdateInput>
    /**
     * Choose, which Product to update.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product updateMany
   */
  export type ProductUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Products.
     */
    data: XOR<ProductUpdateManyMutationInput, ProductUncheckedUpdateManyInput>
    /**
     * Filter which Products to update
     */
    where?: ProductWhereInput
    /**
     * Limit how many Products to update.
     */
    limit?: number
  }

  /**
   * Product updateManyAndReturn
   */
  export type ProductUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * The data used to update Products.
     */
    data: XOR<ProductUpdateManyMutationInput, ProductUncheckedUpdateManyInput>
    /**
     * Filter which Products to update
     */
    where?: ProductWhereInput
    /**
     * Limit how many Products to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Product upsert
   */
  export type ProductUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * The filter to search for the Product to update in case it exists.
     */
    where: ProductWhereUniqueInput
    /**
     * In case the Product found by the `where` argument doesn't exist, create a new Product with this data.
     */
    create: XOR<ProductCreateInput, ProductUncheckedCreateInput>
    /**
     * In case the Product was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProductUpdateInput, ProductUncheckedUpdateInput>
  }

  /**
   * Product delete
   */
  export type ProductDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter which Product to delete.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product deleteMany
   */
  export type ProductDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Products to delete
     */
    where?: ProductWhereInput
    /**
     * Limit how many Products to delete.
     */
    limit?: number
  }

  /**
   * Product.photos
   */
  export type Product$photosArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the File
     */
    select?: FileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the File
     */
    omit?: FileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FileInclude<ExtArgs> | null
    where?: FileWhereInput
    orderBy?: FileOrderByWithRelationInput | FileOrderByWithRelationInput[]
    cursor?: FileWhereUniqueInput
    take?: number
    skip?: number
    distinct?: FileScalarFieldEnum | FileScalarFieldEnum[]
  }

  /**
   * Product.modifierGroups
   */
  export type Product$modifierGroupsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModifierGroup
     */
    select?: ModifierGroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModifierGroup
     */
    omit?: ModifierGroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModifierGroupInclude<ExtArgs> | null
    where?: ModifierGroupWhereInput
    orderBy?: ModifierGroupOrderByWithRelationInput | ModifierGroupOrderByWithRelationInput[]
    cursor?: ModifierGroupWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ModifierGroupScalarFieldEnum | ModifierGroupScalarFieldEnum[]
  }

  /**
   * Product.category
   */
  export type Product$categoryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    where?: CategoryWhereInput
  }

  /**
   * Product.OrderProducts
   */
  export type Product$OrderProductsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderProducts
     */
    select?: OrderProductsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderProducts
     */
    omit?: OrderProductsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderProductsInclude<ExtArgs> | null
    where?: OrderProductsWhereInput
    orderBy?: OrderProductsOrderByWithRelationInput | OrderProductsOrderByWithRelationInput[]
    cursor?: OrderProductsWhereUniqueInput
    take?: number
    skip?: number
    distinct?: OrderProductsScalarFieldEnum | OrderProductsScalarFieldEnum[]
  }

  /**
   * Product without action
   */
  export type ProductDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
  }


  /**
   * Model Category
   */

  export type AggregateCategory = {
    _count: CategoryCountAggregateOutputType | null
    _min: CategoryMinAggregateOutputType | null
    _max: CategoryMaxAggregateOutputType | null
  }

  export type CategoryMinAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    name: string | null
  }

  export type CategoryMaxAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    name: string | null
  }

  export type CategoryCountAggregateOutputType = {
    id: number
    createdAt: number
    name: number
    _all: number
  }


  export type CategoryMinAggregateInputType = {
    id?: true
    createdAt?: true
    name?: true
  }

  export type CategoryMaxAggregateInputType = {
    id?: true
    createdAt?: true
    name?: true
  }

  export type CategoryCountAggregateInputType = {
    id?: true
    createdAt?: true
    name?: true
    _all?: true
  }

  export type CategoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Category to aggregate.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Categories
    **/
    _count?: true | CategoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CategoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CategoryMaxAggregateInputType
  }

  export type GetCategoryAggregateType<T extends CategoryAggregateArgs> = {
        [P in keyof T & keyof AggregateCategory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCategory[P]>
      : GetScalarType<T[P], AggregateCategory[P]>
  }




  export type CategoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CategoryWhereInput
    orderBy?: CategoryOrderByWithAggregationInput | CategoryOrderByWithAggregationInput[]
    by: CategoryScalarFieldEnum[] | CategoryScalarFieldEnum
    having?: CategoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CategoryCountAggregateInputType | true
    _min?: CategoryMinAggregateInputType
    _max?: CategoryMaxAggregateInputType
  }

  export type CategoryGroupByOutputType = {
    id: string
    createdAt: Date
    name: string
    _count: CategoryCountAggregateOutputType | null
    _min: CategoryMinAggregateOutputType | null
    _max: CategoryMaxAggregateOutputType | null
  }

  type GetCategoryGroupByPayload<T extends CategoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CategoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CategoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CategoryGroupByOutputType[P]>
            : GetScalarType<T[P], CategoryGroupByOutputType[P]>
        }
      >
    >


  export type CategorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    name?: boolean
    products?: boolean | Category$productsArgs<ExtArgs>
    _count?: boolean | CategoryCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["category"]>

  export type CategorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    name?: boolean
  }, ExtArgs["result"]["category"]>

  export type CategorySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    name?: boolean
  }, ExtArgs["result"]["category"]>

  export type CategorySelectScalar = {
    id?: boolean
    createdAt?: boolean
    name?: boolean
  }

  export type CategoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "name", ExtArgs["result"]["category"]>
  export type CategoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    products?: boolean | Category$productsArgs<ExtArgs>
    _count?: boolean | CategoryCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CategoryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type CategoryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $CategoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Category"
    objects: {
      products: Prisma.$ProductPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      createdAt: Date
      name: string
    }, ExtArgs["result"]["category"]>
    composites: {}
  }

  type CategoryGetPayload<S extends boolean | null | undefined | CategoryDefaultArgs> = $Result.GetResult<Prisma.$CategoryPayload, S>

  type CategoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CategoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CategoryCountAggregateInputType | true
    }

  export interface CategoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Category'], meta: { name: 'Category' } }
    /**
     * Find zero or one Category that matches the filter.
     * @param {CategoryFindUniqueArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CategoryFindUniqueArgs>(args: SelectSubset<T, CategoryFindUniqueArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Category that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CategoryFindUniqueOrThrowArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CategoryFindUniqueOrThrowArgs>(args: SelectSubset<T, CategoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Category that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindFirstArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CategoryFindFirstArgs>(args?: SelectSubset<T, CategoryFindFirstArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Category that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindFirstOrThrowArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CategoryFindFirstOrThrowArgs>(args?: SelectSubset<T, CategoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Categories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Categories
     * const categories = await prisma.category.findMany()
     * 
     * // Get first 10 Categories
     * const categories = await prisma.category.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const categoryWithIdOnly = await prisma.category.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CategoryFindManyArgs>(args?: SelectSubset<T, CategoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Category.
     * @param {CategoryCreateArgs} args - Arguments to create a Category.
     * @example
     * // Create one Category
     * const Category = await prisma.category.create({
     *   data: {
     *     // ... data to create a Category
     *   }
     * })
     * 
     */
    create<T extends CategoryCreateArgs>(args: SelectSubset<T, CategoryCreateArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Categories.
     * @param {CategoryCreateManyArgs} args - Arguments to create many Categories.
     * @example
     * // Create many Categories
     * const category = await prisma.category.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CategoryCreateManyArgs>(args?: SelectSubset<T, CategoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Categories and returns the data saved in the database.
     * @param {CategoryCreateManyAndReturnArgs} args - Arguments to create many Categories.
     * @example
     * // Create many Categories
     * const category = await prisma.category.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Categories and only return the `id`
     * const categoryWithIdOnly = await prisma.category.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CategoryCreateManyAndReturnArgs>(args?: SelectSubset<T, CategoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Category.
     * @param {CategoryDeleteArgs} args - Arguments to delete one Category.
     * @example
     * // Delete one Category
     * const Category = await prisma.category.delete({
     *   where: {
     *     // ... filter to delete one Category
     *   }
     * })
     * 
     */
    delete<T extends CategoryDeleteArgs>(args: SelectSubset<T, CategoryDeleteArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Category.
     * @param {CategoryUpdateArgs} args - Arguments to update one Category.
     * @example
     * // Update one Category
     * const category = await prisma.category.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CategoryUpdateArgs>(args: SelectSubset<T, CategoryUpdateArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Categories.
     * @param {CategoryDeleteManyArgs} args - Arguments to filter Categories to delete.
     * @example
     * // Delete a few Categories
     * const { count } = await prisma.category.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CategoryDeleteManyArgs>(args?: SelectSubset<T, CategoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Categories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Categories
     * const category = await prisma.category.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CategoryUpdateManyArgs>(args: SelectSubset<T, CategoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Categories and returns the data updated in the database.
     * @param {CategoryUpdateManyAndReturnArgs} args - Arguments to update many Categories.
     * @example
     * // Update many Categories
     * const category = await prisma.category.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Categories and only return the `id`
     * const categoryWithIdOnly = await prisma.category.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CategoryUpdateManyAndReturnArgs>(args: SelectSubset<T, CategoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Category.
     * @param {CategoryUpsertArgs} args - Arguments to update or create a Category.
     * @example
     * // Update or create a Category
     * const category = await prisma.category.upsert({
     *   create: {
     *     // ... data to create a Category
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Category we want to update
     *   }
     * })
     */
    upsert<T extends CategoryUpsertArgs>(args: SelectSubset<T, CategoryUpsertArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Categories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryCountArgs} args - Arguments to filter Categories to count.
     * @example
     * // Count the number of Categories
     * const count = await prisma.category.count({
     *   where: {
     *     // ... the filter for the Categories we want to count
     *   }
     * })
    **/
    count<T extends CategoryCountArgs>(
      args?: Subset<T, CategoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CategoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Category.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CategoryAggregateArgs>(args: Subset<T, CategoryAggregateArgs>): Prisma.PrismaPromise<GetCategoryAggregateType<T>>

    /**
     * Group by Category.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CategoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CategoryGroupByArgs['orderBy'] }
        : { orderBy?: CategoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CategoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCategoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Category model
   */
  readonly fields: CategoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Category.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CategoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    products<T extends Category$productsArgs<ExtArgs> = {}>(args?: Subset<T, Category$productsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Category model
   */
  interface CategoryFieldRefs {
    readonly id: FieldRef<"Category", 'String'>
    readonly createdAt: FieldRef<"Category", 'DateTime'>
    readonly name: FieldRef<"Category", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Category findUnique
   */
  export type CategoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category findUniqueOrThrow
   */
  export type CategoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category findFirst
   */
  export type CategoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Categories.
     */
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category findFirstOrThrow
   */
  export type CategoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Categories.
     */
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category findMany
   */
  export type CategoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Categories to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category create
   */
  export type CategoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The data needed to create a Category.
     */
    data: XOR<CategoryCreateInput, CategoryUncheckedCreateInput>
  }

  /**
   * Category createMany
   */
  export type CategoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Categories.
     */
    data: CategoryCreateManyInput | CategoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Category createManyAndReturn
   */
  export type CategoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * The data used to create many Categories.
     */
    data: CategoryCreateManyInput | CategoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Category update
   */
  export type CategoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The data needed to update a Category.
     */
    data: XOR<CategoryUpdateInput, CategoryUncheckedUpdateInput>
    /**
     * Choose, which Category to update.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category updateMany
   */
  export type CategoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Categories.
     */
    data: XOR<CategoryUpdateManyMutationInput, CategoryUncheckedUpdateManyInput>
    /**
     * Filter which Categories to update
     */
    where?: CategoryWhereInput
    /**
     * Limit how many Categories to update.
     */
    limit?: number
  }

  /**
   * Category updateManyAndReturn
   */
  export type CategoryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * The data used to update Categories.
     */
    data: XOR<CategoryUpdateManyMutationInput, CategoryUncheckedUpdateManyInput>
    /**
     * Filter which Categories to update
     */
    where?: CategoryWhereInput
    /**
     * Limit how many Categories to update.
     */
    limit?: number
  }

  /**
   * Category upsert
   */
  export type CategoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The filter to search for the Category to update in case it exists.
     */
    where: CategoryWhereUniqueInput
    /**
     * In case the Category found by the `where` argument doesn't exist, create a new Category with this data.
     */
    create: XOR<CategoryCreateInput, CategoryUncheckedCreateInput>
    /**
     * In case the Category was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CategoryUpdateInput, CategoryUncheckedUpdateInput>
  }

  /**
   * Category delete
   */
  export type CategoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter which Category to delete.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category deleteMany
   */
  export type CategoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Categories to delete
     */
    where?: CategoryWhereInput
    /**
     * Limit how many Categories to delete.
     */
    limit?: number
  }

  /**
   * Category.products
   */
  export type Category$productsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    where?: ProductWhereInput
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    cursor?: ProductWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Category without action
   */
  export type CategoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
  }


  /**
   * Model Campaign
   */

  export type AggregateCampaign = {
    _count: CampaignCountAggregateOutputType | null
    _min: CampaignMinAggregateOutputType | null
    _max: CampaignMaxAggregateOutputType | null
  }

  export type CampaignMinAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    startedAt: Date | null
  }

  export type CampaignMaxAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    startedAt: Date | null
  }

  export type CampaignCountAggregateOutputType = {
    id: number
    createdAt: number
    startedAt: number
    _all: number
  }


  export type CampaignMinAggregateInputType = {
    id?: true
    createdAt?: true
    startedAt?: true
  }

  export type CampaignMaxAggregateInputType = {
    id?: true
    createdAt?: true
    startedAt?: true
  }

  export type CampaignCountAggregateInputType = {
    id?: true
    createdAt?: true
    startedAt?: true
    _all?: true
  }

  export type CampaignAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Campaign to aggregate.
     */
    where?: CampaignWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Campaigns to fetch.
     */
    orderBy?: CampaignOrderByWithRelationInput | CampaignOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CampaignWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Campaigns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Campaigns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Campaigns
    **/
    _count?: true | CampaignCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CampaignMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CampaignMaxAggregateInputType
  }

  export type GetCampaignAggregateType<T extends CampaignAggregateArgs> = {
        [P in keyof T & keyof AggregateCampaign]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCampaign[P]>
      : GetScalarType<T[P], AggregateCampaign[P]>
  }




  export type CampaignGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CampaignWhereInput
    orderBy?: CampaignOrderByWithAggregationInput | CampaignOrderByWithAggregationInput[]
    by: CampaignScalarFieldEnum[] | CampaignScalarFieldEnum
    having?: CampaignScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CampaignCountAggregateInputType | true
    _min?: CampaignMinAggregateInputType
    _max?: CampaignMaxAggregateInputType
  }

  export type CampaignGroupByOutputType = {
    id: string
    createdAt: Date
    startedAt: Date | null
    _count: CampaignCountAggregateOutputType | null
    _min: CampaignMinAggregateOutputType | null
    _max: CampaignMaxAggregateOutputType | null
  }

  type GetCampaignGroupByPayload<T extends CampaignGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CampaignGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CampaignGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CampaignGroupByOutputType[P]>
            : GetScalarType<T[P], CampaignGroupByOutputType[P]>
        }
      >
    >


  export type CampaignSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    startedAt?: boolean
    promotialMessages?: boolean | Campaign$promotialMessagesArgs<ExtArgs>
    _count?: boolean | CampaignCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["campaign"]>

  export type CampaignSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    startedAt?: boolean
  }, ExtArgs["result"]["campaign"]>

  export type CampaignSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    startedAt?: boolean
  }, ExtArgs["result"]["campaign"]>

  export type CampaignSelectScalar = {
    id?: boolean
    createdAt?: boolean
    startedAt?: boolean
  }

  export type CampaignOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "startedAt", ExtArgs["result"]["campaign"]>
  export type CampaignInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    promotialMessages?: boolean | Campaign$promotialMessagesArgs<ExtArgs>
    _count?: boolean | CampaignCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CampaignIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type CampaignIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $CampaignPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Campaign"
    objects: {
      promotialMessages: Prisma.$PromotialMessagePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      createdAt: Date
      startedAt: Date | null
    }, ExtArgs["result"]["campaign"]>
    composites: {}
  }

  type CampaignGetPayload<S extends boolean | null | undefined | CampaignDefaultArgs> = $Result.GetResult<Prisma.$CampaignPayload, S>

  type CampaignCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CampaignFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CampaignCountAggregateInputType | true
    }

  export interface CampaignDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Campaign'], meta: { name: 'Campaign' } }
    /**
     * Find zero or one Campaign that matches the filter.
     * @param {CampaignFindUniqueArgs} args - Arguments to find a Campaign
     * @example
     * // Get one Campaign
     * const campaign = await prisma.campaign.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CampaignFindUniqueArgs>(args: SelectSubset<T, CampaignFindUniqueArgs<ExtArgs>>): Prisma__CampaignClient<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Campaign that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CampaignFindUniqueOrThrowArgs} args - Arguments to find a Campaign
     * @example
     * // Get one Campaign
     * const campaign = await prisma.campaign.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CampaignFindUniqueOrThrowArgs>(args: SelectSubset<T, CampaignFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CampaignClient<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Campaign that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CampaignFindFirstArgs} args - Arguments to find a Campaign
     * @example
     * // Get one Campaign
     * const campaign = await prisma.campaign.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CampaignFindFirstArgs>(args?: SelectSubset<T, CampaignFindFirstArgs<ExtArgs>>): Prisma__CampaignClient<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Campaign that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CampaignFindFirstOrThrowArgs} args - Arguments to find a Campaign
     * @example
     * // Get one Campaign
     * const campaign = await prisma.campaign.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CampaignFindFirstOrThrowArgs>(args?: SelectSubset<T, CampaignFindFirstOrThrowArgs<ExtArgs>>): Prisma__CampaignClient<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Campaigns that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CampaignFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Campaigns
     * const campaigns = await prisma.campaign.findMany()
     * 
     * // Get first 10 Campaigns
     * const campaigns = await prisma.campaign.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const campaignWithIdOnly = await prisma.campaign.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CampaignFindManyArgs>(args?: SelectSubset<T, CampaignFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Campaign.
     * @param {CampaignCreateArgs} args - Arguments to create a Campaign.
     * @example
     * // Create one Campaign
     * const Campaign = await prisma.campaign.create({
     *   data: {
     *     // ... data to create a Campaign
     *   }
     * })
     * 
     */
    create<T extends CampaignCreateArgs>(args: SelectSubset<T, CampaignCreateArgs<ExtArgs>>): Prisma__CampaignClient<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Campaigns.
     * @param {CampaignCreateManyArgs} args - Arguments to create many Campaigns.
     * @example
     * // Create many Campaigns
     * const campaign = await prisma.campaign.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CampaignCreateManyArgs>(args?: SelectSubset<T, CampaignCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Campaigns and returns the data saved in the database.
     * @param {CampaignCreateManyAndReturnArgs} args - Arguments to create many Campaigns.
     * @example
     * // Create many Campaigns
     * const campaign = await prisma.campaign.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Campaigns and only return the `id`
     * const campaignWithIdOnly = await prisma.campaign.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CampaignCreateManyAndReturnArgs>(args?: SelectSubset<T, CampaignCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Campaign.
     * @param {CampaignDeleteArgs} args - Arguments to delete one Campaign.
     * @example
     * // Delete one Campaign
     * const Campaign = await prisma.campaign.delete({
     *   where: {
     *     // ... filter to delete one Campaign
     *   }
     * })
     * 
     */
    delete<T extends CampaignDeleteArgs>(args: SelectSubset<T, CampaignDeleteArgs<ExtArgs>>): Prisma__CampaignClient<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Campaign.
     * @param {CampaignUpdateArgs} args - Arguments to update one Campaign.
     * @example
     * // Update one Campaign
     * const campaign = await prisma.campaign.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CampaignUpdateArgs>(args: SelectSubset<T, CampaignUpdateArgs<ExtArgs>>): Prisma__CampaignClient<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Campaigns.
     * @param {CampaignDeleteManyArgs} args - Arguments to filter Campaigns to delete.
     * @example
     * // Delete a few Campaigns
     * const { count } = await prisma.campaign.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CampaignDeleteManyArgs>(args?: SelectSubset<T, CampaignDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Campaigns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CampaignUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Campaigns
     * const campaign = await prisma.campaign.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CampaignUpdateManyArgs>(args: SelectSubset<T, CampaignUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Campaigns and returns the data updated in the database.
     * @param {CampaignUpdateManyAndReturnArgs} args - Arguments to update many Campaigns.
     * @example
     * // Update many Campaigns
     * const campaign = await prisma.campaign.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Campaigns and only return the `id`
     * const campaignWithIdOnly = await prisma.campaign.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CampaignUpdateManyAndReturnArgs>(args: SelectSubset<T, CampaignUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Campaign.
     * @param {CampaignUpsertArgs} args - Arguments to update or create a Campaign.
     * @example
     * // Update or create a Campaign
     * const campaign = await prisma.campaign.upsert({
     *   create: {
     *     // ... data to create a Campaign
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Campaign we want to update
     *   }
     * })
     */
    upsert<T extends CampaignUpsertArgs>(args: SelectSubset<T, CampaignUpsertArgs<ExtArgs>>): Prisma__CampaignClient<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Campaigns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CampaignCountArgs} args - Arguments to filter Campaigns to count.
     * @example
     * // Count the number of Campaigns
     * const count = await prisma.campaign.count({
     *   where: {
     *     // ... the filter for the Campaigns we want to count
     *   }
     * })
    **/
    count<T extends CampaignCountArgs>(
      args?: Subset<T, CampaignCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CampaignCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Campaign.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CampaignAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CampaignAggregateArgs>(args: Subset<T, CampaignAggregateArgs>): Prisma.PrismaPromise<GetCampaignAggregateType<T>>

    /**
     * Group by Campaign.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CampaignGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CampaignGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CampaignGroupByArgs['orderBy'] }
        : { orderBy?: CampaignGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CampaignGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCampaignGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Campaign model
   */
  readonly fields: CampaignFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Campaign.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CampaignClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    promotialMessages<T extends Campaign$promotialMessagesArgs<ExtArgs> = {}>(args?: Subset<T, Campaign$promotialMessagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PromotialMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Campaign model
   */
  interface CampaignFieldRefs {
    readonly id: FieldRef<"Campaign", 'String'>
    readonly createdAt: FieldRef<"Campaign", 'DateTime'>
    readonly startedAt: FieldRef<"Campaign", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Campaign findUnique
   */
  export type CampaignFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Campaign
     */
    omit?: CampaignOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
    /**
     * Filter, which Campaign to fetch.
     */
    where: CampaignWhereUniqueInput
  }

  /**
   * Campaign findUniqueOrThrow
   */
  export type CampaignFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Campaign
     */
    omit?: CampaignOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
    /**
     * Filter, which Campaign to fetch.
     */
    where: CampaignWhereUniqueInput
  }

  /**
   * Campaign findFirst
   */
  export type CampaignFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Campaign
     */
    omit?: CampaignOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
    /**
     * Filter, which Campaign to fetch.
     */
    where?: CampaignWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Campaigns to fetch.
     */
    orderBy?: CampaignOrderByWithRelationInput | CampaignOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Campaigns.
     */
    cursor?: CampaignWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Campaigns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Campaigns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Campaigns.
     */
    distinct?: CampaignScalarFieldEnum | CampaignScalarFieldEnum[]
  }

  /**
   * Campaign findFirstOrThrow
   */
  export type CampaignFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Campaign
     */
    omit?: CampaignOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
    /**
     * Filter, which Campaign to fetch.
     */
    where?: CampaignWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Campaigns to fetch.
     */
    orderBy?: CampaignOrderByWithRelationInput | CampaignOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Campaigns.
     */
    cursor?: CampaignWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Campaigns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Campaigns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Campaigns.
     */
    distinct?: CampaignScalarFieldEnum | CampaignScalarFieldEnum[]
  }

  /**
   * Campaign findMany
   */
  export type CampaignFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Campaign
     */
    omit?: CampaignOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
    /**
     * Filter, which Campaigns to fetch.
     */
    where?: CampaignWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Campaigns to fetch.
     */
    orderBy?: CampaignOrderByWithRelationInput | CampaignOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Campaigns.
     */
    cursor?: CampaignWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Campaigns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Campaigns.
     */
    skip?: number
    distinct?: CampaignScalarFieldEnum | CampaignScalarFieldEnum[]
  }

  /**
   * Campaign create
   */
  export type CampaignCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Campaign
     */
    omit?: CampaignOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
    /**
     * The data needed to create a Campaign.
     */
    data: XOR<CampaignCreateInput, CampaignUncheckedCreateInput>
  }

  /**
   * Campaign createMany
   */
  export type CampaignCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Campaigns.
     */
    data: CampaignCreateManyInput | CampaignCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Campaign createManyAndReturn
   */
  export type CampaignCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Campaign
     */
    omit?: CampaignOmit<ExtArgs> | null
    /**
     * The data used to create many Campaigns.
     */
    data: CampaignCreateManyInput | CampaignCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Campaign update
   */
  export type CampaignUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Campaign
     */
    omit?: CampaignOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
    /**
     * The data needed to update a Campaign.
     */
    data: XOR<CampaignUpdateInput, CampaignUncheckedUpdateInput>
    /**
     * Choose, which Campaign to update.
     */
    where: CampaignWhereUniqueInput
  }

  /**
   * Campaign updateMany
   */
  export type CampaignUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Campaigns.
     */
    data: XOR<CampaignUpdateManyMutationInput, CampaignUncheckedUpdateManyInput>
    /**
     * Filter which Campaigns to update
     */
    where?: CampaignWhereInput
    /**
     * Limit how many Campaigns to update.
     */
    limit?: number
  }

  /**
   * Campaign updateManyAndReturn
   */
  export type CampaignUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Campaign
     */
    omit?: CampaignOmit<ExtArgs> | null
    /**
     * The data used to update Campaigns.
     */
    data: XOR<CampaignUpdateManyMutationInput, CampaignUncheckedUpdateManyInput>
    /**
     * Filter which Campaigns to update
     */
    where?: CampaignWhereInput
    /**
     * Limit how many Campaigns to update.
     */
    limit?: number
  }

  /**
   * Campaign upsert
   */
  export type CampaignUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Campaign
     */
    omit?: CampaignOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
    /**
     * The filter to search for the Campaign to update in case it exists.
     */
    where: CampaignWhereUniqueInput
    /**
     * In case the Campaign found by the `where` argument doesn't exist, create a new Campaign with this data.
     */
    create: XOR<CampaignCreateInput, CampaignUncheckedCreateInput>
    /**
     * In case the Campaign was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CampaignUpdateInput, CampaignUncheckedUpdateInput>
  }

  /**
   * Campaign delete
   */
  export type CampaignDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Campaign
     */
    omit?: CampaignOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
    /**
     * Filter which Campaign to delete.
     */
    where: CampaignWhereUniqueInput
  }

  /**
   * Campaign deleteMany
   */
  export type CampaignDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Campaigns to delete
     */
    where?: CampaignWhereInput
    /**
     * Limit how many Campaigns to delete.
     */
    limit?: number
  }

  /**
   * Campaign.promotialMessages
   */
  export type Campaign$promotialMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromotialMessage
     */
    select?: PromotialMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromotialMessage
     */
    omit?: PromotialMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PromotialMessageInclude<ExtArgs> | null
    where?: PromotialMessageWhereInput
    orderBy?: PromotialMessageOrderByWithRelationInput | PromotialMessageOrderByWithRelationInput[]
    cursor?: PromotialMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PromotialMessageScalarFieldEnum | PromotialMessageScalarFieldEnum[]
  }

  /**
   * Campaign without action
   */
  export type CampaignDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Campaign
     */
    omit?: CampaignOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
  }


  /**
   * Model Customer
   */

  export type AggregateCustomer = {
    _count: CustomerCountAggregateOutputType | null
    _min: CustomerMinAggregateOutputType | null
    _max: CustomerMaxAggregateOutputType | null
  }

  export type CustomerMinAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    name: string | null
    email: string | null
    phone: string | null
    address: string | null
    lastMessageSent: Date | null
  }

  export type CustomerMaxAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    name: string | null
    email: string | null
    phone: string | null
    address: string | null
    lastMessageSent: Date | null
  }

  export type CustomerCountAggregateOutputType = {
    id: number
    createdAt: number
    name: number
    email: number
    phone: number
    address: number
    lastMessageSent: number
    _all: number
  }


  export type CustomerMinAggregateInputType = {
    id?: true
    createdAt?: true
    name?: true
    email?: true
    phone?: true
    address?: true
    lastMessageSent?: true
  }

  export type CustomerMaxAggregateInputType = {
    id?: true
    createdAt?: true
    name?: true
    email?: true
    phone?: true
    address?: true
    lastMessageSent?: true
  }

  export type CustomerCountAggregateInputType = {
    id?: true
    createdAt?: true
    name?: true
    email?: true
    phone?: true
    address?: true
    lastMessageSent?: true
    _all?: true
  }

  export type CustomerAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Customer to aggregate.
     */
    where?: CustomerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Customers to fetch.
     */
    orderBy?: CustomerOrderByWithRelationInput | CustomerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CustomerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Customers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Customers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Customers
    **/
    _count?: true | CustomerCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CustomerMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CustomerMaxAggregateInputType
  }

  export type GetCustomerAggregateType<T extends CustomerAggregateArgs> = {
        [P in keyof T & keyof AggregateCustomer]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCustomer[P]>
      : GetScalarType<T[P], AggregateCustomer[P]>
  }




  export type CustomerGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CustomerWhereInput
    orderBy?: CustomerOrderByWithAggregationInput | CustomerOrderByWithAggregationInput[]
    by: CustomerScalarFieldEnum[] | CustomerScalarFieldEnum
    having?: CustomerScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CustomerCountAggregateInputType | true
    _min?: CustomerMinAggregateInputType
    _max?: CustomerMaxAggregateInputType
  }

  export type CustomerGroupByOutputType = {
    id: string
    createdAt: Date
    name: string | null
    email: string | null
    phone: string | null
    address: string | null
    lastMessageSent: Date | null
    _count: CustomerCountAggregateOutputType | null
    _min: CustomerMinAggregateOutputType | null
    _max: CustomerMaxAggregateOutputType | null
  }

  type GetCustomerGroupByPayload<T extends CustomerGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CustomerGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CustomerGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CustomerGroupByOutputType[P]>
            : GetScalarType<T[P], CustomerGroupByOutputType[P]>
        }
      >
    >


  export type CustomerSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    address?: boolean
    lastMessageSent?: boolean
    orders?: boolean | Customer$ordersArgs<ExtArgs>
    promotionalMessages?: boolean | Customer$promotionalMessagesArgs<ExtArgs>
    addresses?: boolean | Customer$addressesArgs<ExtArgs>
    _count?: boolean | CustomerCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["customer"]>

  export type CustomerSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    address?: boolean
    lastMessageSent?: boolean
  }, ExtArgs["result"]["customer"]>

  export type CustomerSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    address?: boolean
    lastMessageSent?: boolean
  }, ExtArgs["result"]["customer"]>

  export type CustomerSelectScalar = {
    id?: boolean
    createdAt?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    address?: boolean
    lastMessageSent?: boolean
  }

  export type CustomerOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "name" | "email" | "phone" | "address" | "lastMessageSent", ExtArgs["result"]["customer"]>
  export type CustomerInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    orders?: boolean | Customer$ordersArgs<ExtArgs>
    promotionalMessages?: boolean | Customer$promotionalMessagesArgs<ExtArgs>
    addresses?: boolean | Customer$addressesArgs<ExtArgs>
    _count?: boolean | CustomerCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CustomerIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type CustomerIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $CustomerPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Customer"
    objects: {
      orders: Prisma.$OrderPayload<ExtArgs>[]
      promotionalMessages: Prisma.$PromotialMessagePayload<ExtArgs>[]
      addresses: Prisma.$DeliveryAddressPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      createdAt: Date
      name: string | null
      email: string | null
      phone: string | null
      address: string | null
      lastMessageSent: Date | null
    }, ExtArgs["result"]["customer"]>
    composites: {}
  }

  type CustomerGetPayload<S extends boolean | null | undefined | CustomerDefaultArgs> = $Result.GetResult<Prisma.$CustomerPayload, S>

  type CustomerCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CustomerFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CustomerCountAggregateInputType | true
    }

  export interface CustomerDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Customer'], meta: { name: 'Customer' } }
    /**
     * Find zero or one Customer that matches the filter.
     * @param {CustomerFindUniqueArgs} args - Arguments to find a Customer
     * @example
     * // Get one Customer
     * const customer = await prisma.customer.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CustomerFindUniqueArgs>(args: SelectSubset<T, CustomerFindUniqueArgs<ExtArgs>>): Prisma__CustomerClient<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Customer that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CustomerFindUniqueOrThrowArgs} args - Arguments to find a Customer
     * @example
     * // Get one Customer
     * const customer = await prisma.customer.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CustomerFindUniqueOrThrowArgs>(args: SelectSubset<T, CustomerFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CustomerClient<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Customer that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerFindFirstArgs} args - Arguments to find a Customer
     * @example
     * // Get one Customer
     * const customer = await prisma.customer.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CustomerFindFirstArgs>(args?: SelectSubset<T, CustomerFindFirstArgs<ExtArgs>>): Prisma__CustomerClient<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Customer that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerFindFirstOrThrowArgs} args - Arguments to find a Customer
     * @example
     * // Get one Customer
     * const customer = await prisma.customer.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CustomerFindFirstOrThrowArgs>(args?: SelectSubset<T, CustomerFindFirstOrThrowArgs<ExtArgs>>): Prisma__CustomerClient<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Customers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Customers
     * const customers = await prisma.customer.findMany()
     * 
     * // Get first 10 Customers
     * const customers = await prisma.customer.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const customerWithIdOnly = await prisma.customer.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CustomerFindManyArgs>(args?: SelectSubset<T, CustomerFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Customer.
     * @param {CustomerCreateArgs} args - Arguments to create a Customer.
     * @example
     * // Create one Customer
     * const Customer = await prisma.customer.create({
     *   data: {
     *     // ... data to create a Customer
     *   }
     * })
     * 
     */
    create<T extends CustomerCreateArgs>(args: SelectSubset<T, CustomerCreateArgs<ExtArgs>>): Prisma__CustomerClient<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Customers.
     * @param {CustomerCreateManyArgs} args - Arguments to create many Customers.
     * @example
     * // Create many Customers
     * const customer = await prisma.customer.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CustomerCreateManyArgs>(args?: SelectSubset<T, CustomerCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Customers and returns the data saved in the database.
     * @param {CustomerCreateManyAndReturnArgs} args - Arguments to create many Customers.
     * @example
     * // Create many Customers
     * const customer = await prisma.customer.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Customers and only return the `id`
     * const customerWithIdOnly = await prisma.customer.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CustomerCreateManyAndReturnArgs>(args?: SelectSubset<T, CustomerCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Customer.
     * @param {CustomerDeleteArgs} args - Arguments to delete one Customer.
     * @example
     * // Delete one Customer
     * const Customer = await prisma.customer.delete({
     *   where: {
     *     // ... filter to delete one Customer
     *   }
     * })
     * 
     */
    delete<T extends CustomerDeleteArgs>(args: SelectSubset<T, CustomerDeleteArgs<ExtArgs>>): Prisma__CustomerClient<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Customer.
     * @param {CustomerUpdateArgs} args - Arguments to update one Customer.
     * @example
     * // Update one Customer
     * const customer = await prisma.customer.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CustomerUpdateArgs>(args: SelectSubset<T, CustomerUpdateArgs<ExtArgs>>): Prisma__CustomerClient<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Customers.
     * @param {CustomerDeleteManyArgs} args - Arguments to filter Customers to delete.
     * @example
     * // Delete a few Customers
     * const { count } = await prisma.customer.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CustomerDeleteManyArgs>(args?: SelectSubset<T, CustomerDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Customers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Customers
     * const customer = await prisma.customer.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CustomerUpdateManyArgs>(args: SelectSubset<T, CustomerUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Customers and returns the data updated in the database.
     * @param {CustomerUpdateManyAndReturnArgs} args - Arguments to update many Customers.
     * @example
     * // Update many Customers
     * const customer = await prisma.customer.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Customers and only return the `id`
     * const customerWithIdOnly = await prisma.customer.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CustomerUpdateManyAndReturnArgs>(args: SelectSubset<T, CustomerUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Customer.
     * @param {CustomerUpsertArgs} args - Arguments to update or create a Customer.
     * @example
     * // Update or create a Customer
     * const customer = await prisma.customer.upsert({
     *   create: {
     *     // ... data to create a Customer
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Customer we want to update
     *   }
     * })
     */
    upsert<T extends CustomerUpsertArgs>(args: SelectSubset<T, CustomerUpsertArgs<ExtArgs>>): Prisma__CustomerClient<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Customers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerCountArgs} args - Arguments to filter Customers to count.
     * @example
     * // Count the number of Customers
     * const count = await prisma.customer.count({
     *   where: {
     *     // ... the filter for the Customers we want to count
     *   }
     * })
    **/
    count<T extends CustomerCountArgs>(
      args?: Subset<T, CustomerCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CustomerCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Customer.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CustomerAggregateArgs>(args: Subset<T, CustomerAggregateArgs>): Prisma.PrismaPromise<GetCustomerAggregateType<T>>

    /**
     * Group by Customer.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CustomerGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CustomerGroupByArgs['orderBy'] }
        : { orderBy?: CustomerGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CustomerGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCustomerGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Customer model
   */
  readonly fields: CustomerFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Customer.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CustomerClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    orders<T extends Customer$ordersArgs<ExtArgs> = {}>(args?: Subset<T, Customer$ordersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    promotionalMessages<T extends Customer$promotionalMessagesArgs<ExtArgs> = {}>(args?: Subset<T, Customer$promotionalMessagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PromotialMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    addresses<T extends Customer$addressesArgs<ExtArgs> = {}>(args?: Subset<T, Customer$addressesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DeliveryAddressPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Customer model
   */
  interface CustomerFieldRefs {
    readonly id: FieldRef<"Customer", 'String'>
    readonly createdAt: FieldRef<"Customer", 'DateTime'>
    readonly name: FieldRef<"Customer", 'String'>
    readonly email: FieldRef<"Customer", 'String'>
    readonly phone: FieldRef<"Customer", 'String'>
    readonly address: FieldRef<"Customer", 'String'>
    readonly lastMessageSent: FieldRef<"Customer", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Customer findUnique
   */
  export type CustomerFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerInclude<ExtArgs> | null
    /**
     * Filter, which Customer to fetch.
     */
    where: CustomerWhereUniqueInput
  }

  /**
   * Customer findUniqueOrThrow
   */
  export type CustomerFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerInclude<ExtArgs> | null
    /**
     * Filter, which Customer to fetch.
     */
    where: CustomerWhereUniqueInput
  }

  /**
   * Customer findFirst
   */
  export type CustomerFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerInclude<ExtArgs> | null
    /**
     * Filter, which Customer to fetch.
     */
    where?: CustomerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Customers to fetch.
     */
    orderBy?: CustomerOrderByWithRelationInput | CustomerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Customers.
     */
    cursor?: CustomerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Customers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Customers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Customers.
     */
    distinct?: CustomerScalarFieldEnum | CustomerScalarFieldEnum[]
  }

  /**
   * Customer findFirstOrThrow
   */
  export type CustomerFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerInclude<ExtArgs> | null
    /**
     * Filter, which Customer to fetch.
     */
    where?: CustomerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Customers to fetch.
     */
    orderBy?: CustomerOrderByWithRelationInput | CustomerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Customers.
     */
    cursor?: CustomerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Customers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Customers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Customers.
     */
    distinct?: CustomerScalarFieldEnum | CustomerScalarFieldEnum[]
  }

  /**
   * Customer findMany
   */
  export type CustomerFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerInclude<ExtArgs> | null
    /**
     * Filter, which Customers to fetch.
     */
    where?: CustomerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Customers to fetch.
     */
    orderBy?: CustomerOrderByWithRelationInput | CustomerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Customers.
     */
    cursor?: CustomerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Customers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Customers.
     */
    skip?: number
    distinct?: CustomerScalarFieldEnum | CustomerScalarFieldEnum[]
  }

  /**
   * Customer create
   */
  export type CustomerCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerInclude<ExtArgs> | null
    /**
     * The data needed to create a Customer.
     */
    data: XOR<CustomerCreateInput, CustomerUncheckedCreateInput>
  }

  /**
   * Customer createMany
   */
  export type CustomerCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Customers.
     */
    data: CustomerCreateManyInput | CustomerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Customer createManyAndReturn
   */
  export type CustomerCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * The data used to create many Customers.
     */
    data: CustomerCreateManyInput | CustomerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Customer update
   */
  export type CustomerUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerInclude<ExtArgs> | null
    /**
     * The data needed to update a Customer.
     */
    data: XOR<CustomerUpdateInput, CustomerUncheckedUpdateInput>
    /**
     * Choose, which Customer to update.
     */
    where: CustomerWhereUniqueInput
  }

  /**
   * Customer updateMany
   */
  export type CustomerUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Customers.
     */
    data: XOR<CustomerUpdateManyMutationInput, CustomerUncheckedUpdateManyInput>
    /**
     * Filter which Customers to update
     */
    where?: CustomerWhereInput
    /**
     * Limit how many Customers to update.
     */
    limit?: number
  }

  /**
   * Customer updateManyAndReturn
   */
  export type CustomerUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * The data used to update Customers.
     */
    data: XOR<CustomerUpdateManyMutationInput, CustomerUncheckedUpdateManyInput>
    /**
     * Filter which Customers to update
     */
    where?: CustomerWhereInput
    /**
     * Limit how many Customers to update.
     */
    limit?: number
  }

  /**
   * Customer upsert
   */
  export type CustomerUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerInclude<ExtArgs> | null
    /**
     * The filter to search for the Customer to update in case it exists.
     */
    where: CustomerWhereUniqueInput
    /**
     * In case the Customer found by the `where` argument doesn't exist, create a new Customer with this data.
     */
    create: XOR<CustomerCreateInput, CustomerUncheckedCreateInput>
    /**
     * In case the Customer was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CustomerUpdateInput, CustomerUncheckedUpdateInput>
  }

  /**
   * Customer delete
   */
  export type CustomerDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerInclude<ExtArgs> | null
    /**
     * Filter which Customer to delete.
     */
    where: CustomerWhereUniqueInput
  }

  /**
   * Customer deleteMany
   */
  export type CustomerDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Customers to delete
     */
    where?: CustomerWhereInput
    /**
     * Limit how many Customers to delete.
     */
    limit?: number
  }

  /**
   * Customer.orders
   */
  export type Customer$ordersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    where?: OrderWhereInput
    orderBy?: OrderOrderByWithRelationInput | OrderOrderByWithRelationInput[]
    cursor?: OrderWhereUniqueInput
    take?: number
    skip?: number
    distinct?: OrderScalarFieldEnum | OrderScalarFieldEnum[]
  }

  /**
   * Customer.promotionalMessages
   */
  export type Customer$promotionalMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromotialMessage
     */
    select?: PromotialMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromotialMessage
     */
    omit?: PromotialMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PromotialMessageInclude<ExtArgs> | null
    where?: PromotialMessageWhereInput
    orderBy?: PromotialMessageOrderByWithRelationInput | PromotialMessageOrderByWithRelationInput[]
    cursor?: PromotialMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PromotialMessageScalarFieldEnum | PromotialMessageScalarFieldEnum[]
  }

  /**
   * Customer.addresses
   */
  export type Customer$addressesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryAddress
     */
    select?: DeliveryAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeliveryAddress
     */
    omit?: DeliveryAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeliveryAddressInclude<ExtArgs> | null
    where?: DeliveryAddressWhereInput
    orderBy?: DeliveryAddressOrderByWithRelationInput | DeliveryAddressOrderByWithRelationInput[]
    cursor?: DeliveryAddressWhereUniqueInput
    take?: number
    skip?: number
    distinct?: DeliveryAddressScalarFieldEnum | DeliveryAddressScalarFieldEnum[]
  }

  /**
   * Customer without action
   */
  export type CustomerDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerInclude<ExtArgs> | null
  }


  /**
   * Model DeliveryAddress
   */

  export type AggregateDeliveryAddress = {
    _count: DeliveryAddressCountAggregateOutputType | null
    _min: DeliveryAddressMinAggregateOutputType | null
    _max: DeliveryAddressMaxAggregateOutputType | null
  }

  export type DeliveryAddressMinAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    lat: string | null
    lng: string | null
    city: string | null
    zipCode: string | null
    State: string | null
    street: string | null
    number: string | null
    description: string | null
    complement: string | null
    numberComplement: string | null
    customerId: string | null
  }

  export type DeliveryAddressMaxAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    lat: string | null
    lng: string | null
    city: string | null
    zipCode: string | null
    State: string | null
    street: string | null
    number: string | null
    description: string | null
    complement: string | null
    numberComplement: string | null
    customerId: string | null
  }

  export type DeliveryAddressCountAggregateOutputType = {
    id: number
    createdAt: number
    lat: number
    lng: number
    city: number
    zipCode: number
    State: number
    street: number
    number: number
    description: number
    complement: number
    numberComplement: number
    customerId: number
    _all: number
  }


  export type DeliveryAddressMinAggregateInputType = {
    id?: true
    createdAt?: true
    lat?: true
    lng?: true
    city?: true
    zipCode?: true
    State?: true
    street?: true
    number?: true
    description?: true
    complement?: true
    numberComplement?: true
    customerId?: true
  }

  export type DeliveryAddressMaxAggregateInputType = {
    id?: true
    createdAt?: true
    lat?: true
    lng?: true
    city?: true
    zipCode?: true
    State?: true
    street?: true
    number?: true
    description?: true
    complement?: true
    numberComplement?: true
    customerId?: true
  }

  export type DeliveryAddressCountAggregateInputType = {
    id?: true
    createdAt?: true
    lat?: true
    lng?: true
    city?: true
    zipCode?: true
    State?: true
    street?: true
    number?: true
    description?: true
    complement?: true
    numberComplement?: true
    customerId?: true
    _all?: true
  }

  export type DeliveryAddressAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DeliveryAddress to aggregate.
     */
    where?: DeliveryAddressWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DeliveryAddresses to fetch.
     */
    orderBy?: DeliveryAddressOrderByWithRelationInput | DeliveryAddressOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DeliveryAddressWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DeliveryAddresses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DeliveryAddresses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned DeliveryAddresses
    **/
    _count?: true | DeliveryAddressCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DeliveryAddressMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DeliveryAddressMaxAggregateInputType
  }

  export type GetDeliveryAddressAggregateType<T extends DeliveryAddressAggregateArgs> = {
        [P in keyof T & keyof AggregateDeliveryAddress]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDeliveryAddress[P]>
      : GetScalarType<T[P], AggregateDeliveryAddress[P]>
  }




  export type DeliveryAddressGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DeliveryAddressWhereInput
    orderBy?: DeliveryAddressOrderByWithAggregationInput | DeliveryAddressOrderByWithAggregationInput[]
    by: DeliveryAddressScalarFieldEnum[] | DeliveryAddressScalarFieldEnum
    having?: DeliveryAddressScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DeliveryAddressCountAggregateInputType | true
    _min?: DeliveryAddressMinAggregateInputType
    _max?: DeliveryAddressMaxAggregateInputType
  }

  export type DeliveryAddressGroupByOutputType = {
    id: string
    createdAt: Date
    lat: string
    lng: string
    city: string
    zipCode: string
    State: string
    street: string
    number: string
    description: string
    complement: string | null
    numberComplement: string | null
    customerId: string | null
    _count: DeliveryAddressCountAggregateOutputType | null
    _min: DeliveryAddressMinAggregateOutputType | null
    _max: DeliveryAddressMaxAggregateOutputType | null
  }

  type GetDeliveryAddressGroupByPayload<T extends DeliveryAddressGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DeliveryAddressGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DeliveryAddressGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DeliveryAddressGroupByOutputType[P]>
            : GetScalarType<T[P], DeliveryAddressGroupByOutputType[P]>
        }
      >
    >


  export type DeliveryAddressSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    lat?: boolean
    lng?: boolean
    city?: boolean
    zipCode?: boolean
    State?: boolean
    street?: boolean
    number?: boolean
    description?: boolean
    complement?: boolean
    numberComplement?: boolean
    customerId?: boolean
    customer?: boolean | DeliveryAddress$customerArgs<ExtArgs>
  }, ExtArgs["result"]["deliveryAddress"]>

  export type DeliveryAddressSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    lat?: boolean
    lng?: boolean
    city?: boolean
    zipCode?: boolean
    State?: boolean
    street?: boolean
    number?: boolean
    description?: boolean
    complement?: boolean
    numberComplement?: boolean
    customerId?: boolean
    customer?: boolean | DeliveryAddress$customerArgs<ExtArgs>
  }, ExtArgs["result"]["deliveryAddress"]>

  export type DeliveryAddressSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    lat?: boolean
    lng?: boolean
    city?: boolean
    zipCode?: boolean
    State?: boolean
    street?: boolean
    number?: boolean
    description?: boolean
    complement?: boolean
    numberComplement?: boolean
    customerId?: boolean
    customer?: boolean | DeliveryAddress$customerArgs<ExtArgs>
  }, ExtArgs["result"]["deliveryAddress"]>

  export type DeliveryAddressSelectScalar = {
    id?: boolean
    createdAt?: boolean
    lat?: boolean
    lng?: boolean
    city?: boolean
    zipCode?: boolean
    State?: boolean
    street?: boolean
    number?: boolean
    description?: boolean
    complement?: boolean
    numberComplement?: boolean
    customerId?: boolean
  }

  export type DeliveryAddressOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "lat" | "lng" | "city" | "zipCode" | "State" | "street" | "number" | "description" | "complement" | "numberComplement" | "customerId", ExtArgs["result"]["deliveryAddress"]>
  export type DeliveryAddressInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    customer?: boolean | DeliveryAddress$customerArgs<ExtArgs>
  }
  export type DeliveryAddressIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    customer?: boolean | DeliveryAddress$customerArgs<ExtArgs>
  }
  export type DeliveryAddressIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    customer?: boolean | DeliveryAddress$customerArgs<ExtArgs>
  }

  export type $DeliveryAddressPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "DeliveryAddress"
    objects: {
      customer: Prisma.$CustomerPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      createdAt: Date
      lat: string
      lng: string
      city: string
      zipCode: string
      State: string
      street: string
      number: string
      description: string
      complement: string | null
      numberComplement: string | null
      customerId: string | null
    }, ExtArgs["result"]["deliveryAddress"]>
    composites: {}
  }

  type DeliveryAddressGetPayload<S extends boolean | null | undefined | DeliveryAddressDefaultArgs> = $Result.GetResult<Prisma.$DeliveryAddressPayload, S>

  type DeliveryAddressCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<DeliveryAddressFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: DeliveryAddressCountAggregateInputType | true
    }

  export interface DeliveryAddressDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['DeliveryAddress'], meta: { name: 'DeliveryAddress' } }
    /**
     * Find zero or one DeliveryAddress that matches the filter.
     * @param {DeliveryAddressFindUniqueArgs} args - Arguments to find a DeliveryAddress
     * @example
     * // Get one DeliveryAddress
     * const deliveryAddress = await prisma.deliveryAddress.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DeliveryAddressFindUniqueArgs>(args: SelectSubset<T, DeliveryAddressFindUniqueArgs<ExtArgs>>): Prisma__DeliveryAddressClient<$Result.GetResult<Prisma.$DeliveryAddressPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one DeliveryAddress that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {DeliveryAddressFindUniqueOrThrowArgs} args - Arguments to find a DeliveryAddress
     * @example
     * // Get one DeliveryAddress
     * const deliveryAddress = await prisma.deliveryAddress.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DeliveryAddressFindUniqueOrThrowArgs>(args: SelectSubset<T, DeliveryAddressFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DeliveryAddressClient<$Result.GetResult<Prisma.$DeliveryAddressPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first DeliveryAddress that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeliveryAddressFindFirstArgs} args - Arguments to find a DeliveryAddress
     * @example
     * // Get one DeliveryAddress
     * const deliveryAddress = await prisma.deliveryAddress.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DeliveryAddressFindFirstArgs>(args?: SelectSubset<T, DeliveryAddressFindFirstArgs<ExtArgs>>): Prisma__DeliveryAddressClient<$Result.GetResult<Prisma.$DeliveryAddressPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first DeliveryAddress that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeliveryAddressFindFirstOrThrowArgs} args - Arguments to find a DeliveryAddress
     * @example
     * // Get one DeliveryAddress
     * const deliveryAddress = await prisma.deliveryAddress.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DeliveryAddressFindFirstOrThrowArgs>(args?: SelectSubset<T, DeliveryAddressFindFirstOrThrowArgs<ExtArgs>>): Prisma__DeliveryAddressClient<$Result.GetResult<Prisma.$DeliveryAddressPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more DeliveryAddresses that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeliveryAddressFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all DeliveryAddresses
     * const deliveryAddresses = await prisma.deliveryAddress.findMany()
     * 
     * // Get first 10 DeliveryAddresses
     * const deliveryAddresses = await prisma.deliveryAddress.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const deliveryAddressWithIdOnly = await prisma.deliveryAddress.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DeliveryAddressFindManyArgs>(args?: SelectSubset<T, DeliveryAddressFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DeliveryAddressPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a DeliveryAddress.
     * @param {DeliveryAddressCreateArgs} args - Arguments to create a DeliveryAddress.
     * @example
     * // Create one DeliveryAddress
     * const DeliveryAddress = await prisma.deliveryAddress.create({
     *   data: {
     *     // ... data to create a DeliveryAddress
     *   }
     * })
     * 
     */
    create<T extends DeliveryAddressCreateArgs>(args: SelectSubset<T, DeliveryAddressCreateArgs<ExtArgs>>): Prisma__DeliveryAddressClient<$Result.GetResult<Prisma.$DeliveryAddressPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many DeliveryAddresses.
     * @param {DeliveryAddressCreateManyArgs} args - Arguments to create many DeliveryAddresses.
     * @example
     * // Create many DeliveryAddresses
     * const deliveryAddress = await prisma.deliveryAddress.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DeliveryAddressCreateManyArgs>(args?: SelectSubset<T, DeliveryAddressCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many DeliveryAddresses and returns the data saved in the database.
     * @param {DeliveryAddressCreateManyAndReturnArgs} args - Arguments to create many DeliveryAddresses.
     * @example
     * // Create many DeliveryAddresses
     * const deliveryAddress = await prisma.deliveryAddress.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many DeliveryAddresses and only return the `id`
     * const deliveryAddressWithIdOnly = await prisma.deliveryAddress.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DeliveryAddressCreateManyAndReturnArgs>(args?: SelectSubset<T, DeliveryAddressCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DeliveryAddressPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a DeliveryAddress.
     * @param {DeliveryAddressDeleteArgs} args - Arguments to delete one DeliveryAddress.
     * @example
     * // Delete one DeliveryAddress
     * const DeliveryAddress = await prisma.deliveryAddress.delete({
     *   where: {
     *     // ... filter to delete one DeliveryAddress
     *   }
     * })
     * 
     */
    delete<T extends DeliveryAddressDeleteArgs>(args: SelectSubset<T, DeliveryAddressDeleteArgs<ExtArgs>>): Prisma__DeliveryAddressClient<$Result.GetResult<Prisma.$DeliveryAddressPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one DeliveryAddress.
     * @param {DeliveryAddressUpdateArgs} args - Arguments to update one DeliveryAddress.
     * @example
     * // Update one DeliveryAddress
     * const deliveryAddress = await prisma.deliveryAddress.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DeliveryAddressUpdateArgs>(args: SelectSubset<T, DeliveryAddressUpdateArgs<ExtArgs>>): Prisma__DeliveryAddressClient<$Result.GetResult<Prisma.$DeliveryAddressPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more DeliveryAddresses.
     * @param {DeliveryAddressDeleteManyArgs} args - Arguments to filter DeliveryAddresses to delete.
     * @example
     * // Delete a few DeliveryAddresses
     * const { count } = await prisma.deliveryAddress.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DeliveryAddressDeleteManyArgs>(args?: SelectSubset<T, DeliveryAddressDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DeliveryAddresses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeliveryAddressUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many DeliveryAddresses
     * const deliveryAddress = await prisma.deliveryAddress.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DeliveryAddressUpdateManyArgs>(args: SelectSubset<T, DeliveryAddressUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DeliveryAddresses and returns the data updated in the database.
     * @param {DeliveryAddressUpdateManyAndReturnArgs} args - Arguments to update many DeliveryAddresses.
     * @example
     * // Update many DeliveryAddresses
     * const deliveryAddress = await prisma.deliveryAddress.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more DeliveryAddresses and only return the `id`
     * const deliveryAddressWithIdOnly = await prisma.deliveryAddress.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends DeliveryAddressUpdateManyAndReturnArgs>(args: SelectSubset<T, DeliveryAddressUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DeliveryAddressPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one DeliveryAddress.
     * @param {DeliveryAddressUpsertArgs} args - Arguments to update or create a DeliveryAddress.
     * @example
     * // Update or create a DeliveryAddress
     * const deliveryAddress = await prisma.deliveryAddress.upsert({
     *   create: {
     *     // ... data to create a DeliveryAddress
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the DeliveryAddress we want to update
     *   }
     * })
     */
    upsert<T extends DeliveryAddressUpsertArgs>(args: SelectSubset<T, DeliveryAddressUpsertArgs<ExtArgs>>): Prisma__DeliveryAddressClient<$Result.GetResult<Prisma.$DeliveryAddressPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of DeliveryAddresses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeliveryAddressCountArgs} args - Arguments to filter DeliveryAddresses to count.
     * @example
     * // Count the number of DeliveryAddresses
     * const count = await prisma.deliveryAddress.count({
     *   where: {
     *     // ... the filter for the DeliveryAddresses we want to count
     *   }
     * })
    **/
    count<T extends DeliveryAddressCountArgs>(
      args?: Subset<T, DeliveryAddressCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DeliveryAddressCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a DeliveryAddress.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeliveryAddressAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DeliveryAddressAggregateArgs>(args: Subset<T, DeliveryAddressAggregateArgs>): Prisma.PrismaPromise<GetDeliveryAddressAggregateType<T>>

    /**
     * Group by DeliveryAddress.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeliveryAddressGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DeliveryAddressGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DeliveryAddressGroupByArgs['orderBy'] }
        : { orderBy?: DeliveryAddressGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DeliveryAddressGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDeliveryAddressGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the DeliveryAddress model
   */
  readonly fields: DeliveryAddressFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for DeliveryAddress.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DeliveryAddressClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    customer<T extends DeliveryAddress$customerArgs<ExtArgs> = {}>(args?: Subset<T, DeliveryAddress$customerArgs<ExtArgs>>): Prisma__CustomerClient<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the DeliveryAddress model
   */
  interface DeliveryAddressFieldRefs {
    readonly id: FieldRef<"DeliveryAddress", 'String'>
    readonly createdAt: FieldRef<"DeliveryAddress", 'DateTime'>
    readonly lat: FieldRef<"DeliveryAddress", 'String'>
    readonly lng: FieldRef<"DeliveryAddress", 'String'>
    readonly city: FieldRef<"DeliveryAddress", 'String'>
    readonly zipCode: FieldRef<"DeliveryAddress", 'String'>
    readonly State: FieldRef<"DeliveryAddress", 'String'>
    readonly street: FieldRef<"DeliveryAddress", 'String'>
    readonly number: FieldRef<"DeliveryAddress", 'String'>
    readonly description: FieldRef<"DeliveryAddress", 'String'>
    readonly complement: FieldRef<"DeliveryAddress", 'String'>
    readonly numberComplement: FieldRef<"DeliveryAddress", 'String'>
    readonly customerId: FieldRef<"DeliveryAddress", 'String'>
  }
    

  // Custom InputTypes
  /**
   * DeliveryAddress findUnique
   */
  export type DeliveryAddressFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryAddress
     */
    select?: DeliveryAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeliveryAddress
     */
    omit?: DeliveryAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeliveryAddressInclude<ExtArgs> | null
    /**
     * Filter, which DeliveryAddress to fetch.
     */
    where: DeliveryAddressWhereUniqueInput
  }

  /**
   * DeliveryAddress findUniqueOrThrow
   */
  export type DeliveryAddressFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryAddress
     */
    select?: DeliveryAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeliveryAddress
     */
    omit?: DeliveryAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeliveryAddressInclude<ExtArgs> | null
    /**
     * Filter, which DeliveryAddress to fetch.
     */
    where: DeliveryAddressWhereUniqueInput
  }

  /**
   * DeliveryAddress findFirst
   */
  export type DeliveryAddressFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryAddress
     */
    select?: DeliveryAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeliveryAddress
     */
    omit?: DeliveryAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeliveryAddressInclude<ExtArgs> | null
    /**
     * Filter, which DeliveryAddress to fetch.
     */
    where?: DeliveryAddressWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DeliveryAddresses to fetch.
     */
    orderBy?: DeliveryAddressOrderByWithRelationInput | DeliveryAddressOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DeliveryAddresses.
     */
    cursor?: DeliveryAddressWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DeliveryAddresses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DeliveryAddresses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DeliveryAddresses.
     */
    distinct?: DeliveryAddressScalarFieldEnum | DeliveryAddressScalarFieldEnum[]
  }

  /**
   * DeliveryAddress findFirstOrThrow
   */
  export type DeliveryAddressFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryAddress
     */
    select?: DeliveryAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeliveryAddress
     */
    omit?: DeliveryAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeliveryAddressInclude<ExtArgs> | null
    /**
     * Filter, which DeliveryAddress to fetch.
     */
    where?: DeliveryAddressWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DeliveryAddresses to fetch.
     */
    orderBy?: DeliveryAddressOrderByWithRelationInput | DeliveryAddressOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DeliveryAddresses.
     */
    cursor?: DeliveryAddressWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DeliveryAddresses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DeliveryAddresses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DeliveryAddresses.
     */
    distinct?: DeliveryAddressScalarFieldEnum | DeliveryAddressScalarFieldEnum[]
  }

  /**
   * DeliveryAddress findMany
   */
  export type DeliveryAddressFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryAddress
     */
    select?: DeliveryAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeliveryAddress
     */
    omit?: DeliveryAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeliveryAddressInclude<ExtArgs> | null
    /**
     * Filter, which DeliveryAddresses to fetch.
     */
    where?: DeliveryAddressWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DeliveryAddresses to fetch.
     */
    orderBy?: DeliveryAddressOrderByWithRelationInput | DeliveryAddressOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing DeliveryAddresses.
     */
    cursor?: DeliveryAddressWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DeliveryAddresses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DeliveryAddresses.
     */
    skip?: number
    distinct?: DeliveryAddressScalarFieldEnum | DeliveryAddressScalarFieldEnum[]
  }

  /**
   * DeliveryAddress create
   */
  export type DeliveryAddressCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryAddress
     */
    select?: DeliveryAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeliveryAddress
     */
    omit?: DeliveryAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeliveryAddressInclude<ExtArgs> | null
    /**
     * The data needed to create a DeliveryAddress.
     */
    data: XOR<DeliveryAddressCreateInput, DeliveryAddressUncheckedCreateInput>
  }

  /**
   * DeliveryAddress createMany
   */
  export type DeliveryAddressCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many DeliveryAddresses.
     */
    data: DeliveryAddressCreateManyInput | DeliveryAddressCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * DeliveryAddress createManyAndReturn
   */
  export type DeliveryAddressCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryAddress
     */
    select?: DeliveryAddressSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the DeliveryAddress
     */
    omit?: DeliveryAddressOmit<ExtArgs> | null
    /**
     * The data used to create many DeliveryAddresses.
     */
    data: DeliveryAddressCreateManyInput | DeliveryAddressCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeliveryAddressIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * DeliveryAddress update
   */
  export type DeliveryAddressUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryAddress
     */
    select?: DeliveryAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeliveryAddress
     */
    omit?: DeliveryAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeliveryAddressInclude<ExtArgs> | null
    /**
     * The data needed to update a DeliveryAddress.
     */
    data: XOR<DeliveryAddressUpdateInput, DeliveryAddressUncheckedUpdateInput>
    /**
     * Choose, which DeliveryAddress to update.
     */
    where: DeliveryAddressWhereUniqueInput
  }

  /**
   * DeliveryAddress updateMany
   */
  export type DeliveryAddressUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update DeliveryAddresses.
     */
    data: XOR<DeliveryAddressUpdateManyMutationInput, DeliveryAddressUncheckedUpdateManyInput>
    /**
     * Filter which DeliveryAddresses to update
     */
    where?: DeliveryAddressWhereInput
    /**
     * Limit how many DeliveryAddresses to update.
     */
    limit?: number
  }

  /**
   * DeliveryAddress updateManyAndReturn
   */
  export type DeliveryAddressUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryAddress
     */
    select?: DeliveryAddressSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the DeliveryAddress
     */
    omit?: DeliveryAddressOmit<ExtArgs> | null
    /**
     * The data used to update DeliveryAddresses.
     */
    data: XOR<DeliveryAddressUpdateManyMutationInput, DeliveryAddressUncheckedUpdateManyInput>
    /**
     * Filter which DeliveryAddresses to update
     */
    where?: DeliveryAddressWhereInput
    /**
     * Limit how many DeliveryAddresses to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeliveryAddressIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * DeliveryAddress upsert
   */
  export type DeliveryAddressUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryAddress
     */
    select?: DeliveryAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeliveryAddress
     */
    omit?: DeliveryAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeliveryAddressInclude<ExtArgs> | null
    /**
     * The filter to search for the DeliveryAddress to update in case it exists.
     */
    where: DeliveryAddressWhereUniqueInput
    /**
     * In case the DeliveryAddress found by the `where` argument doesn't exist, create a new DeliveryAddress with this data.
     */
    create: XOR<DeliveryAddressCreateInput, DeliveryAddressUncheckedCreateInput>
    /**
     * In case the DeliveryAddress was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DeliveryAddressUpdateInput, DeliveryAddressUncheckedUpdateInput>
  }

  /**
   * DeliveryAddress delete
   */
  export type DeliveryAddressDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryAddress
     */
    select?: DeliveryAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeliveryAddress
     */
    omit?: DeliveryAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeliveryAddressInclude<ExtArgs> | null
    /**
     * Filter which DeliveryAddress to delete.
     */
    where: DeliveryAddressWhereUniqueInput
  }

  /**
   * DeliveryAddress deleteMany
   */
  export type DeliveryAddressDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DeliveryAddresses to delete
     */
    where?: DeliveryAddressWhereInput
    /**
     * Limit how many DeliveryAddresses to delete.
     */
    limit?: number
  }

  /**
   * DeliveryAddress.customer
   */
  export type DeliveryAddress$customerArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerInclude<ExtArgs> | null
    where?: CustomerWhereInput
  }

  /**
   * DeliveryAddress without action
   */
  export type DeliveryAddressDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DeliveryAddress
     */
    select?: DeliveryAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DeliveryAddress
     */
    omit?: DeliveryAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeliveryAddressInclude<ExtArgs> | null
  }


  /**
   * Model Message
   */

  export type AggregateMessage = {
    _count: MessageCountAggregateOutputType | null
    _min: MessageMinAggregateOutputType | null
    _max: MessageMaxAggregateOutputType | null
  }

  export type MessageMinAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    name: string | null
    content: string | null
    media: string | null
  }

  export type MessageMaxAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    name: string | null
    content: string | null
    media: string | null
  }

  export type MessageCountAggregateOutputType = {
    id: number
    createdAt: number
    name: number
    content: number
    media: number
    _all: number
  }


  export type MessageMinAggregateInputType = {
    id?: true
    createdAt?: true
    name?: true
    content?: true
    media?: true
  }

  export type MessageMaxAggregateInputType = {
    id?: true
    createdAt?: true
    name?: true
    content?: true
    media?: true
  }

  export type MessageCountAggregateInputType = {
    id?: true
    createdAt?: true
    name?: true
    content?: true
    media?: true
    _all?: true
  }

  export type MessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Message to aggregate.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Messages
    **/
    _count?: true | MessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MessageMaxAggregateInputType
  }

  export type GetMessageAggregateType<T extends MessageAggregateArgs> = {
        [P in keyof T & keyof AggregateMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMessage[P]>
      : GetScalarType<T[P], AggregateMessage[P]>
  }




  export type MessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithAggregationInput | MessageOrderByWithAggregationInput[]
    by: MessageScalarFieldEnum[] | MessageScalarFieldEnum
    having?: MessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MessageCountAggregateInputType | true
    _min?: MessageMinAggregateInputType
    _max?: MessageMaxAggregateInputType
  }

  export type MessageGroupByOutputType = {
    id: string
    createdAt: Date
    name: string
    content: string
    media: string | null
    _count: MessageCountAggregateOutputType | null
    _min: MessageMinAggregateOutputType | null
    _max: MessageMaxAggregateOutputType | null
  }

  type GetMessageGroupByPayload<T extends MessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MessageGroupByOutputType[P]>
            : GetScalarType<T[P], MessageGroupByOutputType[P]>
        }
      >
    >


  export type MessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    name?: boolean
    content?: boolean
    media?: boolean
    promotialMessages?: boolean | Message$promotialMessagesArgs<ExtArgs>
    _count?: boolean | MessageCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["message"]>

  export type MessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    name?: boolean
    content?: boolean
    media?: boolean
  }, ExtArgs["result"]["message"]>

  export type MessageSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    name?: boolean
    content?: boolean
    media?: boolean
  }, ExtArgs["result"]["message"]>

  export type MessageSelectScalar = {
    id?: boolean
    createdAt?: boolean
    name?: boolean
    content?: boolean
    media?: boolean
  }

  export type MessageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "name" | "content" | "media", ExtArgs["result"]["message"]>
  export type MessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    promotialMessages?: boolean | Message$promotialMessagesArgs<ExtArgs>
    _count?: boolean | MessageCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type MessageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type MessageIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $MessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Message"
    objects: {
      promotialMessages: Prisma.$PromotialMessagePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      createdAt: Date
      name: string
      content: string
      media: string | null
    }, ExtArgs["result"]["message"]>
    composites: {}
  }

  type MessageGetPayload<S extends boolean | null | undefined | MessageDefaultArgs> = $Result.GetResult<Prisma.$MessagePayload, S>

  type MessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MessageCountAggregateInputType | true
    }

  export interface MessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Message'], meta: { name: 'Message' } }
    /**
     * Find zero or one Message that matches the filter.
     * @param {MessageFindUniqueArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MessageFindUniqueArgs>(args: SelectSubset<T, MessageFindUniqueArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Message that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MessageFindUniqueOrThrowArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MessageFindUniqueOrThrowArgs>(args: SelectSubset<T, MessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Message that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindFirstArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MessageFindFirstArgs>(args?: SelectSubset<T, MessageFindFirstArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Message that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindFirstOrThrowArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MessageFindFirstOrThrowArgs>(args?: SelectSubset<T, MessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Messages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Messages
     * const messages = await prisma.message.findMany()
     * 
     * // Get first 10 Messages
     * const messages = await prisma.message.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const messageWithIdOnly = await prisma.message.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MessageFindManyArgs>(args?: SelectSubset<T, MessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Message.
     * @param {MessageCreateArgs} args - Arguments to create a Message.
     * @example
     * // Create one Message
     * const Message = await prisma.message.create({
     *   data: {
     *     // ... data to create a Message
     *   }
     * })
     * 
     */
    create<T extends MessageCreateArgs>(args: SelectSubset<T, MessageCreateArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Messages.
     * @param {MessageCreateManyArgs} args - Arguments to create many Messages.
     * @example
     * // Create many Messages
     * const message = await prisma.message.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MessageCreateManyArgs>(args?: SelectSubset<T, MessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Messages and returns the data saved in the database.
     * @param {MessageCreateManyAndReturnArgs} args - Arguments to create many Messages.
     * @example
     * // Create many Messages
     * const message = await prisma.message.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Messages and only return the `id`
     * const messageWithIdOnly = await prisma.message.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MessageCreateManyAndReturnArgs>(args?: SelectSubset<T, MessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Message.
     * @param {MessageDeleteArgs} args - Arguments to delete one Message.
     * @example
     * // Delete one Message
     * const Message = await prisma.message.delete({
     *   where: {
     *     // ... filter to delete one Message
     *   }
     * })
     * 
     */
    delete<T extends MessageDeleteArgs>(args: SelectSubset<T, MessageDeleteArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Message.
     * @param {MessageUpdateArgs} args - Arguments to update one Message.
     * @example
     * // Update one Message
     * const message = await prisma.message.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MessageUpdateArgs>(args: SelectSubset<T, MessageUpdateArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Messages.
     * @param {MessageDeleteManyArgs} args - Arguments to filter Messages to delete.
     * @example
     * // Delete a few Messages
     * const { count } = await prisma.message.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MessageDeleteManyArgs>(args?: SelectSubset<T, MessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Messages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Messages
     * const message = await prisma.message.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MessageUpdateManyArgs>(args: SelectSubset<T, MessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Messages and returns the data updated in the database.
     * @param {MessageUpdateManyAndReturnArgs} args - Arguments to update many Messages.
     * @example
     * // Update many Messages
     * const message = await prisma.message.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Messages and only return the `id`
     * const messageWithIdOnly = await prisma.message.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MessageUpdateManyAndReturnArgs>(args: SelectSubset<T, MessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Message.
     * @param {MessageUpsertArgs} args - Arguments to update or create a Message.
     * @example
     * // Update or create a Message
     * const message = await prisma.message.upsert({
     *   create: {
     *     // ... data to create a Message
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Message we want to update
     *   }
     * })
     */
    upsert<T extends MessageUpsertArgs>(args: SelectSubset<T, MessageUpsertArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Messages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageCountArgs} args - Arguments to filter Messages to count.
     * @example
     * // Count the number of Messages
     * const count = await prisma.message.count({
     *   where: {
     *     // ... the filter for the Messages we want to count
     *   }
     * })
    **/
    count<T extends MessageCountArgs>(
      args?: Subset<T, MessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Message.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MessageAggregateArgs>(args: Subset<T, MessageAggregateArgs>): Prisma.PrismaPromise<GetMessageAggregateType<T>>

    /**
     * Group by Message.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MessageGroupByArgs['orderBy'] }
        : { orderBy?: MessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Message model
   */
  readonly fields: MessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Message.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    promotialMessages<T extends Message$promotialMessagesArgs<ExtArgs> = {}>(args?: Subset<T, Message$promotialMessagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PromotialMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Message model
   */
  interface MessageFieldRefs {
    readonly id: FieldRef<"Message", 'String'>
    readonly createdAt: FieldRef<"Message", 'DateTime'>
    readonly name: FieldRef<"Message", 'String'>
    readonly content: FieldRef<"Message", 'String'>
    readonly media: FieldRef<"Message", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Message findUnique
   */
  export type MessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message findUniqueOrThrow
   */
  export type MessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message findFirst
   */
  export type MessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Messages.
     */
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message findFirstOrThrow
   */
  export type MessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Messages.
     */
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message findMany
   */
  export type MessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Messages to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message create
   */
  export type MessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The data needed to create a Message.
     */
    data: XOR<MessageCreateInput, MessageUncheckedCreateInput>
  }

  /**
   * Message createMany
   */
  export type MessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Messages.
     */
    data: MessageCreateManyInput | MessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Message createManyAndReturn
   */
  export type MessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * The data used to create many Messages.
     */
    data: MessageCreateManyInput | MessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Message update
   */
  export type MessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The data needed to update a Message.
     */
    data: XOR<MessageUpdateInput, MessageUncheckedUpdateInput>
    /**
     * Choose, which Message to update.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message updateMany
   */
  export type MessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Messages.
     */
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyInput>
    /**
     * Filter which Messages to update
     */
    where?: MessageWhereInput
    /**
     * Limit how many Messages to update.
     */
    limit?: number
  }

  /**
   * Message updateManyAndReturn
   */
  export type MessageUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * The data used to update Messages.
     */
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyInput>
    /**
     * Filter which Messages to update
     */
    where?: MessageWhereInput
    /**
     * Limit how many Messages to update.
     */
    limit?: number
  }

  /**
   * Message upsert
   */
  export type MessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The filter to search for the Message to update in case it exists.
     */
    where: MessageWhereUniqueInput
    /**
     * In case the Message found by the `where` argument doesn't exist, create a new Message with this data.
     */
    create: XOR<MessageCreateInput, MessageUncheckedCreateInput>
    /**
     * In case the Message was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MessageUpdateInput, MessageUncheckedUpdateInput>
  }

  /**
   * Message delete
   */
  export type MessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter which Message to delete.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message deleteMany
   */
  export type MessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Messages to delete
     */
    where?: MessageWhereInput
    /**
     * Limit how many Messages to delete.
     */
    limit?: number
  }

  /**
   * Message.promotialMessages
   */
  export type Message$promotialMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromotialMessage
     */
    select?: PromotialMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromotialMessage
     */
    omit?: PromotialMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PromotialMessageInclude<ExtArgs> | null
    where?: PromotialMessageWhereInput
    orderBy?: PromotialMessageOrderByWithRelationInput | PromotialMessageOrderByWithRelationInput[]
    cursor?: PromotialMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PromotialMessageScalarFieldEnum | PromotialMessageScalarFieldEnum[]
  }

  /**
   * Message without action
   */
  export type MessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
  }


  /**
   * Model PromotialMessage
   */

  export type AggregatePromotialMessage = {
    _count: PromotialMessageCountAggregateOutputType | null
    _min: PromotialMessageMinAggregateOutputType | null
    _max: PromotialMessageMaxAggregateOutputType | null
  }

  export type PromotialMessageMinAggregateOutputType = {
    id: string | null
    sentAt: Date | null
    campaignId: string | null
    messageId: string | null
    customerId: string | null
  }

  export type PromotialMessageMaxAggregateOutputType = {
    id: string | null
    sentAt: Date | null
    campaignId: string | null
    messageId: string | null
    customerId: string | null
  }

  export type PromotialMessageCountAggregateOutputType = {
    id: number
    sentAt: number
    campaignId: number
    messageId: number
    customerId: number
    _all: number
  }


  export type PromotialMessageMinAggregateInputType = {
    id?: true
    sentAt?: true
    campaignId?: true
    messageId?: true
    customerId?: true
  }

  export type PromotialMessageMaxAggregateInputType = {
    id?: true
    sentAt?: true
    campaignId?: true
    messageId?: true
    customerId?: true
  }

  export type PromotialMessageCountAggregateInputType = {
    id?: true
    sentAt?: true
    campaignId?: true
    messageId?: true
    customerId?: true
    _all?: true
  }

  export type PromotialMessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PromotialMessage to aggregate.
     */
    where?: PromotialMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PromotialMessages to fetch.
     */
    orderBy?: PromotialMessageOrderByWithRelationInput | PromotialMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PromotialMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PromotialMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PromotialMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PromotialMessages
    **/
    _count?: true | PromotialMessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PromotialMessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PromotialMessageMaxAggregateInputType
  }

  export type GetPromotialMessageAggregateType<T extends PromotialMessageAggregateArgs> = {
        [P in keyof T & keyof AggregatePromotialMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePromotialMessage[P]>
      : GetScalarType<T[P], AggregatePromotialMessage[P]>
  }




  export type PromotialMessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PromotialMessageWhereInput
    orderBy?: PromotialMessageOrderByWithAggregationInput | PromotialMessageOrderByWithAggregationInput[]
    by: PromotialMessageScalarFieldEnum[] | PromotialMessageScalarFieldEnum
    having?: PromotialMessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PromotialMessageCountAggregateInputType | true
    _min?: PromotialMessageMinAggregateInputType
    _max?: PromotialMessageMaxAggregateInputType
  }

  export type PromotialMessageGroupByOutputType = {
    id: string
    sentAt: Date
    campaignId: string | null
    messageId: string
    customerId: string
    _count: PromotialMessageCountAggregateOutputType | null
    _min: PromotialMessageMinAggregateOutputType | null
    _max: PromotialMessageMaxAggregateOutputType | null
  }

  type GetPromotialMessageGroupByPayload<T extends PromotialMessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PromotialMessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PromotialMessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PromotialMessageGroupByOutputType[P]>
            : GetScalarType<T[P], PromotialMessageGroupByOutputType[P]>
        }
      >
    >


  export type PromotialMessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sentAt?: boolean
    campaignId?: boolean
    messageId?: boolean
    customerId?: boolean
    Campaign?: boolean | PromotialMessage$CampaignArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
    Customer?: boolean | CustomerDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["promotialMessage"]>

  export type PromotialMessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sentAt?: boolean
    campaignId?: boolean
    messageId?: boolean
    customerId?: boolean
    Campaign?: boolean | PromotialMessage$CampaignArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
    Customer?: boolean | CustomerDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["promotialMessage"]>

  export type PromotialMessageSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sentAt?: boolean
    campaignId?: boolean
    messageId?: boolean
    customerId?: boolean
    Campaign?: boolean | PromotialMessage$CampaignArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
    Customer?: boolean | CustomerDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["promotialMessage"]>

  export type PromotialMessageSelectScalar = {
    id?: boolean
    sentAt?: boolean
    campaignId?: boolean
    messageId?: boolean
    customerId?: boolean
  }

  export type PromotialMessageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "sentAt" | "campaignId" | "messageId" | "customerId", ExtArgs["result"]["promotialMessage"]>
  export type PromotialMessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Campaign?: boolean | PromotialMessage$CampaignArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
    Customer?: boolean | CustomerDefaultArgs<ExtArgs>
  }
  export type PromotialMessageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Campaign?: boolean | PromotialMessage$CampaignArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
    Customer?: boolean | CustomerDefaultArgs<ExtArgs>
  }
  export type PromotialMessageIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    Campaign?: boolean | PromotialMessage$CampaignArgs<ExtArgs>
    message?: boolean | MessageDefaultArgs<ExtArgs>
    Customer?: boolean | CustomerDefaultArgs<ExtArgs>
  }

  export type $PromotialMessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PromotialMessage"
    objects: {
      Campaign: Prisma.$CampaignPayload<ExtArgs> | null
      message: Prisma.$MessagePayload<ExtArgs>
      Customer: Prisma.$CustomerPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      sentAt: Date
      campaignId: string | null
      messageId: string
      customerId: string
    }, ExtArgs["result"]["promotialMessage"]>
    composites: {}
  }

  type PromotialMessageGetPayload<S extends boolean | null | undefined | PromotialMessageDefaultArgs> = $Result.GetResult<Prisma.$PromotialMessagePayload, S>

  type PromotialMessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PromotialMessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PromotialMessageCountAggregateInputType | true
    }

  export interface PromotialMessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PromotialMessage'], meta: { name: 'PromotialMessage' } }
    /**
     * Find zero or one PromotialMessage that matches the filter.
     * @param {PromotialMessageFindUniqueArgs} args - Arguments to find a PromotialMessage
     * @example
     * // Get one PromotialMessage
     * const promotialMessage = await prisma.promotialMessage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PromotialMessageFindUniqueArgs>(args: SelectSubset<T, PromotialMessageFindUniqueArgs<ExtArgs>>): Prisma__PromotialMessageClient<$Result.GetResult<Prisma.$PromotialMessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PromotialMessage that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PromotialMessageFindUniqueOrThrowArgs} args - Arguments to find a PromotialMessage
     * @example
     * // Get one PromotialMessage
     * const promotialMessage = await prisma.promotialMessage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PromotialMessageFindUniqueOrThrowArgs>(args: SelectSubset<T, PromotialMessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PromotialMessageClient<$Result.GetResult<Prisma.$PromotialMessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PromotialMessage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PromotialMessageFindFirstArgs} args - Arguments to find a PromotialMessage
     * @example
     * // Get one PromotialMessage
     * const promotialMessage = await prisma.promotialMessage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PromotialMessageFindFirstArgs>(args?: SelectSubset<T, PromotialMessageFindFirstArgs<ExtArgs>>): Prisma__PromotialMessageClient<$Result.GetResult<Prisma.$PromotialMessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PromotialMessage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PromotialMessageFindFirstOrThrowArgs} args - Arguments to find a PromotialMessage
     * @example
     * // Get one PromotialMessage
     * const promotialMessage = await prisma.promotialMessage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PromotialMessageFindFirstOrThrowArgs>(args?: SelectSubset<T, PromotialMessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__PromotialMessageClient<$Result.GetResult<Prisma.$PromotialMessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PromotialMessages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PromotialMessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PromotialMessages
     * const promotialMessages = await prisma.promotialMessage.findMany()
     * 
     * // Get first 10 PromotialMessages
     * const promotialMessages = await prisma.promotialMessage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const promotialMessageWithIdOnly = await prisma.promotialMessage.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PromotialMessageFindManyArgs>(args?: SelectSubset<T, PromotialMessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PromotialMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PromotialMessage.
     * @param {PromotialMessageCreateArgs} args - Arguments to create a PromotialMessage.
     * @example
     * // Create one PromotialMessage
     * const PromotialMessage = await prisma.promotialMessage.create({
     *   data: {
     *     // ... data to create a PromotialMessage
     *   }
     * })
     * 
     */
    create<T extends PromotialMessageCreateArgs>(args: SelectSubset<T, PromotialMessageCreateArgs<ExtArgs>>): Prisma__PromotialMessageClient<$Result.GetResult<Prisma.$PromotialMessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PromotialMessages.
     * @param {PromotialMessageCreateManyArgs} args - Arguments to create many PromotialMessages.
     * @example
     * // Create many PromotialMessages
     * const promotialMessage = await prisma.promotialMessage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PromotialMessageCreateManyArgs>(args?: SelectSubset<T, PromotialMessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PromotialMessages and returns the data saved in the database.
     * @param {PromotialMessageCreateManyAndReturnArgs} args - Arguments to create many PromotialMessages.
     * @example
     * // Create many PromotialMessages
     * const promotialMessage = await prisma.promotialMessage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PromotialMessages and only return the `id`
     * const promotialMessageWithIdOnly = await prisma.promotialMessage.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PromotialMessageCreateManyAndReturnArgs>(args?: SelectSubset<T, PromotialMessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PromotialMessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PromotialMessage.
     * @param {PromotialMessageDeleteArgs} args - Arguments to delete one PromotialMessage.
     * @example
     * // Delete one PromotialMessage
     * const PromotialMessage = await prisma.promotialMessage.delete({
     *   where: {
     *     // ... filter to delete one PromotialMessage
     *   }
     * })
     * 
     */
    delete<T extends PromotialMessageDeleteArgs>(args: SelectSubset<T, PromotialMessageDeleteArgs<ExtArgs>>): Prisma__PromotialMessageClient<$Result.GetResult<Prisma.$PromotialMessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PromotialMessage.
     * @param {PromotialMessageUpdateArgs} args - Arguments to update one PromotialMessage.
     * @example
     * // Update one PromotialMessage
     * const promotialMessage = await prisma.promotialMessage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PromotialMessageUpdateArgs>(args: SelectSubset<T, PromotialMessageUpdateArgs<ExtArgs>>): Prisma__PromotialMessageClient<$Result.GetResult<Prisma.$PromotialMessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PromotialMessages.
     * @param {PromotialMessageDeleteManyArgs} args - Arguments to filter PromotialMessages to delete.
     * @example
     * // Delete a few PromotialMessages
     * const { count } = await prisma.promotialMessage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PromotialMessageDeleteManyArgs>(args?: SelectSubset<T, PromotialMessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PromotialMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PromotialMessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PromotialMessages
     * const promotialMessage = await prisma.promotialMessage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PromotialMessageUpdateManyArgs>(args: SelectSubset<T, PromotialMessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PromotialMessages and returns the data updated in the database.
     * @param {PromotialMessageUpdateManyAndReturnArgs} args - Arguments to update many PromotialMessages.
     * @example
     * // Update many PromotialMessages
     * const promotialMessage = await prisma.promotialMessage.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PromotialMessages and only return the `id`
     * const promotialMessageWithIdOnly = await prisma.promotialMessage.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PromotialMessageUpdateManyAndReturnArgs>(args: SelectSubset<T, PromotialMessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PromotialMessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PromotialMessage.
     * @param {PromotialMessageUpsertArgs} args - Arguments to update or create a PromotialMessage.
     * @example
     * // Update or create a PromotialMessage
     * const promotialMessage = await prisma.promotialMessage.upsert({
     *   create: {
     *     // ... data to create a PromotialMessage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PromotialMessage we want to update
     *   }
     * })
     */
    upsert<T extends PromotialMessageUpsertArgs>(args: SelectSubset<T, PromotialMessageUpsertArgs<ExtArgs>>): Prisma__PromotialMessageClient<$Result.GetResult<Prisma.$PromotialMessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PromotialMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PromotialMessageCountArgs} args - Arguments to filter PromotialMessages to count.
     * @example
     * // Count the number of PromotialMessages
     * const count = await prisma.promotialMessage.count({
     *   where: {
     *     // ... the filter for the PromotialMessages we want to count
     *   }
     * })
    **/
    count<T extends PromotialMessageCountArgs>(
      args?: Subset<T, PromotialMessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PromotialMessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PromotialMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PromotialMessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PromotialMessageAggregateArgs>(args: Subset<T, PromotialMessageAggregateArgs>): Prisma.PrismaPromise<GetPromotialMessageAggregateType<T>>

    /**
     * Group by PromotialMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PromotialMessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PromotialMessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PromotialMessageGroupByArgs['orderBy'] }
        : { orderBy?: PromotialMessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PromotialMessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPromotialMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PromotialMessage model
   */
  readonly fields: PromotialMessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PromotialMessage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PromotialMessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    Campaign<T extends PromotialMessage$CampaignArgs<ExtArgs> = {}>(args?: Subset<T, PromotialMessage$CampaignArgs<ExtArgs>>): Prisma__CampaignClient<$Result.GetResult<Prisma.$CampaignPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    message<T extends MessageDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MessageDefaultArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    Customer<T extends CustomerDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CustomerDefaultArgs<ExtArgs>>): Prisma__CustomerClient<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PromotialMessage model
   */
  interface PromotialMessageFieldRefs {
    readonly id: FieldRef<"PromotialMessage", 'String'>
    readonly sentAt: FieldRef<"PromotialMessage", 'DateTime'>
    readonly campaignId: FieldRef<"PromotialMessage", 'String'>
    readonly messageId: FieldRef<"PromotialMessage", 'String'>
    readonly customerId: FieldRef<"PromotialMessage", 'String'>
  }
    

  // Custom InputTypes
  /**
   * PromotialMessage findUnique
   */
  export type PromotialMessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromotialMessage
     */
    select?: PromotialMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromotialMessage
     */
    omit?: PromotialMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PromotialMessageInclude<ExtArgs> | null
    /**
     * Filter, which PromotialMessage to fetch.
     */
    where: PromotialMessageWhereUniqueInput
  }

  /**
   * PromotialMessage findUniqueOrThrow
   */
  export type PromotialMessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromotialMessage
     */
    select?: PromotialMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromotialMessage
     */
    omit?: PromotialMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PromotialMessageInclude<ExtArgs> | null
    /**
     * Filter, which PromotialMessage to fetch.
     */
    where: PromotialMessageWhereUniqueInput
  }

  /**
   * PromotialMessage findFirst
   */
  export type PromotialMessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromotialMessage
     */
    select?: PromotialMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromotialMessage
     */
    omit?: PromotialMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PromotialMessageInclude<ExtArgs> | null
    /**
     * Filter, which PromotialMessage to fetch.
     */
    where?: PromotialMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PromotialMessages to fetch.
     */
    orderBy?: PromotialMessageOrderByWithRelationInput | PromotialMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PromotialMessages.
     */
    cursor?: PromotialMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PromotialMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PromotialMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PromotialMessages.
     */
    distinct?: PromotialMessageScalarFieldEnum | PromotialMessageScalarFieldEnum[]
  }

  /**
   * PromotialMessage findFirstOrThrow
   */
  export type PromotialMessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromotialMessage
     */
    select?: PromotialMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromotialMessage
     */
    omit?: PromotialMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PromotialMessageInclude<ExtArgs> | null
    /**
     * Filter, which PromotialMessage to fetch.
     */
    where?: PromotialMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PromotialMessages to fetch.
     */
    orderBy?: PromotialMessageOrderByWithRelationInput | PromotialMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PromotialMessages.
     */
    cursor?: PromotialMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PromotialMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PromotialMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PromotialMessages.
     */
    distinct?: PromotialMessageScalarFieldEnum | PromotialMessageScalarFieldEnum[]
  }

  /**
   * PromotialMessage findMany
   */
  export type PromotialMessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromotialMessage
     */
    select?: PromotialMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromotialMessage
     */
    omit?: PromotialMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PromotialMessageInclude<ExtArgs> | null
    /**
     * Filter, which PromotialMessages to fetch.
     */
    where?: PromotialMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PromotialMessages to fetch.
     */
    orderBy?: PromotialMessageOrderByWithRelationInput | PromotialMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PromotialMessages.
     */
    cursor?: PromotialMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PromotialMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PromotialMessages.
     */
    skip?: number
    distinct?: PromotialMessageScalarFieldEnum | PromotialMessageScalarFieldEnum[]
  }

  /**
   * PromotialMessage create
   */
  export type PromotialMessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromotialMessage
     */
    select?: PromotialMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromotialMessage
     */
    omit?: PromotialMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PromotialMessageInclude<ExtArgs> | null
    /**
     * The data needed to create a PromotialMessage.
     */
    data: XOR<PromotialMessageCreateInput, PromotialMessageUncheckedCreateInput>
  }

  /**
   * PromotialMessage createMany
   */
  export type PromotialMessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PromotialMessages.
     */
    data: PromotialMessageCreateManyInput | PromotialMessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PromotialMessage createManyAndReturn
   */
  export type PromotialMessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromotialMessage
     */
    select?: PromotialMessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PromotialMessage
     */
    omit?: PromotialMessageOmit<ExtArgs> | null
    /**
     * The data used to create many PromotialMessages.
     */
    data: PromotialMessageCreateManyInput | PromotialMessageCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PromotialMessageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PromotialMessage update
   */
  export type PromotialMessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromotialMessage
     */
    select?: PromotialMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromotialMessage
     */
    omit?: PromotialMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PromotialMessageInclude<ExtArgs> | null
    /**
     * The data needed to update a PromotialMessage.
     */
    data: XOR<PromotialMessageUpdateInput, PromotialMessageUncheckedUpdateInput>
    /**
     * Choose, which PromotialMessage to update.
     */
    where: PromotialMessageWhereUniqueInput
  }

  /**
   * PromotialMessage updateMany
   */
  export type PromotialMessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PromotialMessages.
     */
    data: XOR<PromotialMessageUpdateManyMutationInput, PromotialMessageUncheckedUpdateManyInput>
    /**
     * Filter which PromotialMessages to update
     */
    where?: PromotialMessageWhereInput
    /**
     * Limit how many PromotialMessages to update.
     */
    limit?: number
  }

  /**
   * PromotialMessage updateManyAndReturn
   */
  export type PromotialMessageUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromotialMessage
     */
    select?: PromotialMessageSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PromotialMessage
     */
    omit?: PromotialMessageOmit<ExtArgs> | null
    /**
     * The data used to update PromotialMessages.
     */
    data: XOR<PromotialMessageUpdateManyMutationInput, PromotialMessageUncheckedUpdateManyInput>
    /**
     * Filter which PromotialMessages to update
     */
    where?: PromotialMessageWhereInput
    /**
     * Limit how many PromotialMessages to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PromotialMessageIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PromotialMessage upsert
   */
  export type PromotialMessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromotialMessage
     */
    select?: PromotialMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromotialMessage
     */
    omit?: PromotialMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PromotialMessageInclude<ExtArgs> | null
    /**
     * The filter to search for the PromotialMessage to update in case it exists.
     */
    where: PromotialMessageWhereUniqueInput
    /**
     * In case the PromotialMessage found by the `where` argument doesn't exist, create a new PromotialMessage with this data.
     */
    create: XOR<PromotialMessageCreateInput, PromotialMessageUncheckedCreateInput>
    /**
     * In case the PromotialMessage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PromotialMessageUpdateInput, PromotialMessageUncheckedUpdateInput>
  }

  /**
   * PromotialMessage delete
   */
  export type PromotialMessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromotialMessage
     */
    select?: PromotialMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromotialMessage
     */
    omit?: PromotialMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PromotialMessageInclude<ExtArgs> | null
    /**
     * Filter which PromotialMessage to delete.
     */
    where: PromotialMessageWhereUniqueInput
  }

  /**
   * PromotialMessage deleteMany
   */
  export type PromotialMessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PromotialMessages to delete
     */
    where?: PromotialMessageWhereInput
    /**
     * Limit how many PromotialMessages to delete.
     */
    limit?: number
  }

  /**
   * PromotialMessage.Campaign
   */
  export type PromotialMessage$CampaignArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Campaign
     */
    select?: CampaignSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Campaign
     */
    omit?: CampaignOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CampaignInclude<ExtArgs> | null
    where?: CampaignWhereInput
  }

  /**
   * PromotialMessage without action
   */
  export type PromotialMessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PromotialMessage
     */
    select?: PromotialMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PromotialMessage
     */
    omit?: PromotialMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PromotialMessageInclude<ExtArgs> | null
  }


  /**
   * Model Order
   */

  export type AggregateOrder = {
    _count: OrderCountAggregateOutputType | null
    _avg: OrderAvgAggregateOutputType | null
    _sum: OrderSumAggregateOutputType | null
    _min: OrderMinAggregateOutputType | null
    _max: OrderMaxAggregateOutputType | null
  }

  export type OrderAvgAggregateOutputType = {
    amount: number | null
    tipAmount: number | null
  }

  export type OrderSumAggregateOutputType = {
    amount: number | null
    tipAmount: number | null
  }

  export type OrderMinAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    amount: number | null
    type: $Enums.OrderType | null
    paymentMethod: $Enums.PaymentType | null
    tipAmount: number | null
    customerId: string | null
    externalId: string | null
    addressId: string | null
  }

  export type OrderMaxAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    amount: number | null
    type: $Enums.OrderType | null
    paymentMethod: $Enums.PaymentType | null
    tipAmount: number | null
    customerId: string | null
    externalId: string | null
    addressId: string | null
  }

  export type OrderCountAggregateOutputType = {
    id: number
    createdAt: number
    amount: number
    type: number
    paymentMethod: number
    tipAmount: number
    customerId: number
    externalId: number
    addressId: number
    _all: number
  }


  export type OrderAvgAggregateInputType = {
    amount?: true
    tipAmount?: true
  }

  export type OrderSumAggregateInputType = {
    amount?: true
    tipAmount?: true
  }

  export type OrderMinAggregateInputType = {
    id?: true
    createdAt?: true
    amount?: true
    type?: true
    paymentMethod?: true
    tipAmount?: true
    customerId?: true
    externalId?: true
    addressId?: true
  }

  export type OrderMaxAggregateInputType = {
    id?: true
    createdAt?: true
    amount?: true
    type?: true
    paymentMethod?: true
    tipAmount?: true
    customerId?: true
    externalId?: true
    addressId?: true
  }

  export type OrderCountAggregateInputType = {
    id?: true
    createdAt?: true
    amount?: true
    type?: true
    paymentMethod?: true
    tipAmount?: true
    customerId?: true
    externalId?: true
    addressId?: true
    _all?: true
  }

  export type OrderAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Order to aggregate.
     */
    where?: OrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Orders to fetch.
     */
    orderBy?: OrderOrderByWithRelationInput | OrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: OrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Orders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Orders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Orders
    **/
    _count?: true | OrderCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: OrderAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: OrderSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: OrderMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: OrderMaxAggregateInputType
  }

  export type GetOrderAggregateType<T extends OrderAggregateArgs> = {
        [P in keyof T & keyof AggregateOrder]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateOrder[P]>
      : GetScalarType<T[P], AggregateOrder[P]>
  }




  export type OrderGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OrderWhereInput
    orderBy?: OrderOrderByWithAggregationInput | OrderOrderByWithAggregationInput[]
    by: OrderScalarFieldEnum[] | OrderScalarFieldEnum
    having?: OrderScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: OrderCountAggregateInputType | true
    _avg?: OrderAvgAggregateInputType
    _sum?: OrderSumAggregateInputType
    _min?: OrderMinAggregateInputType
    _max?: OrderMaxAggregateInputType
  }

  export type OrderGroupByOutputType = {
    id: string
    createdAt: Date
    amount: number
    type: $Enums.OrderType
    paymentMethod: $Enums.PaymentType
    tipAmount: number | null
    customerId: string
    externalId: string | null
    addressId: string | null
    _count: OrderCountAggregateOutputType | null
    _avg: OrderAvgAggregateOutputType | null
    _sum: OrderSumAggregateOutputType | null
    _min: OrderMinAggregateOutputType | null
    _max: OrderMaxAggregateOutputType | null
  }

  type GetOrderGroupByPayload<T extends OrderGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<OrderGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof OrderGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], OrderGroupByOutputType[P]>
            : GetScalarType<T[P], OrderGroupByOutputType[P]>
        }
      >
    >


  export type OrderSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    amount?: boolean
    type?: boolean
    paymentMethod?: boolean
    tipAmount?: boolean
    customerId?: boolean
    externalId?: boolean
    addressId?: boolean
    customer?: boolean | CustomerDefaultArgs<ExtArgs>
    address?: boolean | Order$addressArgs<ExtArgs>
    orderProducts?: boolean | Order$orderProductsArgs<ExtArgs>
    _count?: boolean | OrderCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["order"]>

  export type OrderSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    amount?: boolean
    type?: boolean
    paymentMethod?: boolean
    tipAmount?: boolean
    customerId?: boolean
    externalId?: boolean
    addressId?: boolean
    customer?: boolean | CustomerDefaultArgs<ExtArgs>
    address?: boolean | Order$addressArgs<ExtArgs>
  }, ExtArgs["result"]["order"]>

  export type OrderSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    amount?: boolean
    type?: boolean
    paymentMethod?: boolean
    tipAmount?: boolean
    customerId?: boolean
    externalId?: boolean
    addressId?: boolean
    customer?: boolean | CustomerDefaultArgs<ExtArgs>
    address?: boolean | Order$addressArgs<ExtArgs>
  }, ExtArgs["result"]["order"]>

  export type OrderSelectScalar = {
    id?: boolean
    createdAt?: boolean
    amount?: boolean
    type?: boolean
    paymentMethod?: boolean
    tipAmount?: boolean
    customerId?: boolean
    externalId?: boolean
    addressId?: boolean
  }

  export type OrderOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "amount" | "type" | "paymentMethod" | "tipAmount" | "customerId" | "externalId" | "addressId", ExtArgs["result"]["order"]>
  export type OrderInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    customer?: boolean | CustomerDefaultArgs<ExtArgs>
    address?: boolean | Order$addressArgs<ExtArgs>
    orderProducts?: boolean | Order$orderProductsArgs<ExtArgs>
    _count?: boolean | OrderCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type OrderIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    customer?: boolean | CustomerDefaultArgs<ExtArgs>
    address?: boolean | Order$addressArgs<ExtArgs>
  }
  export type OrderIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    customer?: boolean | CustomerDefaultArgs<ExtArgs>
    address?: boolean | Order$addressArgs<ExtArgs>
  }

  export type $OrderPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Order"
    objects: {
      customer: Prisma.$CustomerPayload<ExtArgs>
      address: Prisma.$AddressPayload<ExtArgs> | null
      orderProducts: Prisma.$OrderProductsPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      createdAt: Date
      amount: number
      type: $Enums.OrderType
      paymentMethod: $Enums.PaymentType
      tipAmount: number | null
      customerId: string
      externalId: string | null
      addressId: string | null
    }, ExtArgs["result"]["order"]>
    composites: {}
  }

  type OrderGetPayload<S extends boolean | null | undefined | OrderDefaultArgs> = $Result.GetResult<Prisma.$OrderPayload, S>

  type OrderCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<OrderFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: OrderCountAggregateInputType | true
    }

  export interface OrderDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Order'], meta: { name: 'Order' } }
    /**
     * Find zero or one Order that matches the filter.
     * @param {OrderFindUniqueArgs} args - Arguments to find a Order
     * @example
     * // Get one Order
     * const order = await prisma.order.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends OrderFindUniqueArgs>(args: SelectSubset<T, OrderFindUniqueArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Order that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {OrderFindUniqueOrThrowArgs} args - Arguments to find a Order
     * @example
     * // Get one Order
     * const order = await prisma.order.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends OrderFindUniqueOrThrowArgs>(args: SelectSubset<T, OrderFindUniqueOrThrowArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Order that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderFindFirstArgs} args - Arguments to find a Order
     * @example
     * // Get one Order
     * const order = await prisma.order.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends OrderFindFirstArgs>(args?: SelectSubset<T, OrderFindFirstArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Order that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderFindFirstOrThrowArgs} args - Arguments to find a Order
     * @example
     * // Get one Order
     * const order = await prisma.order.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends OrderFindFirstOrThrowArgs>(args?: SelectSubset<T, OrderFindFirstOrThrowArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Orders that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Orders
     * const orders = await prisma.order.findMany()
     * 
     * // Get first 10 Orders
     * const orders = await prisma.order.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const orderWithIdOnly = await prisma.order.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends OrderFindManyArgs>(args?: SelectSubset<T, OrderFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Order.
     * @param {OrderCreateArgs} args - Arguments to create a Order.
     * @example
     * // Create one Order
     * const Order = await prisma.order.create({
     *   data: {
     *     // ... data to create a Order
     *   }
     * })
     * 
     */
    create<T extends OrderCreateArgs>(args: SelectSubset<T, OrderCreateArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Orders.
     * @param {OrderCreateManyArgs} args - Arguments to create many Orders.
     * @example
     * // Create many Orders
     * const order = await prisma.order.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends OrderCreateManyArgs>(args?: SelectSubset<T, OrderCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Orders and returns the data saved in the database.
     * @param {OrderCreateManyAndReturnArgs} args - Arguments to create many Orders.
     * @example
     * // Create many Orders
     * const order = await prisma.order.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Orders and only return the `id`
     * const orderWithIdOnly = await prisma.order.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends OrderCreateManyAndReturnArgs>(args?: SelectSubset<T, OrderCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Order.
     * @param {OrderDeleteArgs} args - Arguments to delete one Order.
     * @example
     * // Delete one Order
     * const Order = await prisma.order.delete({
     *   where: {
     *     // ... filter to delete one Order
     *   }
     * })
     * 
     */
    delete<T extends OrderDeleteArgs>(args: SelectSubset<T, OrderDeleteArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Order.
     * @param {OrderUpdateArgs} args - Arguments to update one Order.
     * @example
     * // Update one Order
     * const order = await prisma.order.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends OrderUpdateArgs>(args: SelectSubset<T, OrderUpdateArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Orders.
     * @param {OrderDeleteManyArgs} args - Arguments to filter Orders to delete.
     * @example
     * // Delete a few Orders
     * const { count } = await prisma.order.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends OrderDeleteManyArgs>(args?: SelectSubset<T, OrderDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Orders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Orders
     * const order = await prisma.order.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends OrderUpdateManyArgs>(args: SelectSubset<T, OrderUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Orders and returns the data updated in the database.
     * @param {OrderUpdateManyAndReturnArgs} args - Arguments to update many Orders.
     * @example
     * // Update many Orders
     * const order = await prisma.order.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Orders and only return the `id`
     * const orderWithIdOnly = await prisma.order.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends OrderUpdateManyAndReturnArgs>(args: SelectSubset<T, OrderUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Order.
     * @param {OrderUpsertArgs} args - Arguments to update or create a Order.
     * @example
     * // Update or create a Order
     * const order = await prisma.order.upsert({
     *   create: {
     *     // ... data to create a Order
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Order we want to update
     *   }
     * })
     */
    upsert<T extends OrderUpsertArgs>(args: SelectSubset<T, OrderUpsertArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Orders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderCountArgs} args - Arguments to filter Orders to count.
     * @example
     * // Count the number of Orders
     * const count = await prisma.order.count({
     *   where: {
     *     // ... the filter for the Orders we want to count
     *   }
     * })
    **/
    count<T extends OrderCountArgs>(
      args?: Subset<T, OrderCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], OrderCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Order.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends OrderAggregateArgs>(args: Subset<T, OrderAggregateArgs>): Prisma.PrismaPromise<GetOrderAggregateType<T>>

    /**
     * Group by Order.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends OrderGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: OrderGroupByArgs['orderBy'] }
        : { orderBy?: OrderGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, OrderGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOrderGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Order model
   */
  readonly fields: OrderFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Order.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__OrderClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    customer<T extends CustomerDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CustomerDefaultArgs<ExtArgs>>): Prisma__CustomerClient<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    address<T extends Order$addressArgs<ExtArgs> = {}>(args?: Subset<T, Order$addressArgs<ExtArgs>>): Prisma__AddressClient<$Result.GetResult<Prisma.$AddressPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    orderProducts<T extends Order$orderProductsArgs<ExtArgs> = {}>(args?: Subset<T, Order$orderProductsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrderProductsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Order model
   */
  interface OrderFieldRefs {
    readonly id: FieldRef<"Order", 'String'>
    readonly createdAt: FieldRef<"Order", 'DateTime'>
    readonly amount: FieldRef<"Order", 'Int'>
    readonly type: FieldRef<"Order", 'OrderType'>
    readonly paymentMethod: FieldRef<"Order", 'PaymentType'>
    readonly tipAmount: FieldRef<"Order", 'Int'>
    readonly customerId: FieldRef<"Order", 'String'>
    readonly externalId: FieldRef<"Order", 'String'>
    readonly addressId: FieldRef<"Order", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Order findUnique
   */
  export type OrderFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    /**
     * Filter, which Order to fetch.
     */
    where: OrderWhereUniqueInput
  }

  /**
   * Order findUniqueOrThrow
   */
  export type OrderFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    /**
     * Filter, which Order to fetch.
     */
    where: OrderWhereUniqueInput
  }

  /**
   * Order findFirst
   */
  export type OrderFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    /**
     * Filter, which Order to fetch.
     */
    where?: OrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Orders to fetch.
     */
    orderBy?: OrderOrderByWithRelationInput | OrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Orders.
     */
    cursor?: OrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Orders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Orders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Orders.
     */
    distinct?: OrderScalarFieldEnum | OrderScalarFieldEnum[]
  }

  /**
   * Order findFirstOrThrow
   */
  export type OrderFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    /**
     * Filter, which Order to fetch.
     */
    where?: OrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Orders to fetch.
     */
    orderBy?: OrderOrderByWithRelationInput | OrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Orders.
     */
    cursor?: OrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Orders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Orders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Orders.
     */
    distinct?: OrderScalarFieldEnum | OrderScalarFieldEnum[]
  }

  /**
   * Order findMany
   */
  export type OrderFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    /**
     * Filter, which Orders to fetch.
     */
    where?: OrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Orders to fetch.
     */
    orderBy?: OrderOrderByWithRelationInput | OrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Orders.
     */
    cursor?: OrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Orders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Orders.
     */
    skip?: number
    distinct?: OrderScalarFieldEnum | OrderScalarFieldEnum[]
  }

  /**
   * Order create
   */
  export type OrderCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    /**
     * The data needed to create a Order.
     */
    data: XOR<OrderCreateInput, OrderUncheckedCreateInput>
  }

  /**
   * Order createMany
   */
  export type OrderCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Orders.
     */
    data: OrderCreateManyInput | OrderCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Order createManyAndReturn
   */
  export type OrderCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * The data used to create many Orders.
     */
    data: OrderCreateManyInput | OrderCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Order update
   */
  export type OrderUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    /**
     * The data needed to update a Order.
     */
    data: XOR<OrderUpdateInput, OrderUncheckedUpdateInput>
    /**
     * Choose, which Order to update.
     */
    where: OrderWhereUniqueInput
  }

  /**
   * Order updateMany
   */
  export type OrderUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Orders.
     */
    data: XOR<OrderUpdateManyMutationInput, OrderUncheckedUpdateManyInput>
    /**
     * Filter which Orders to update
     */
    where?: OrderWhereInput
    /**
     * Limit how many Orders to update.
     */
    limit?: number
  }

  /**
   * Order updateManyAndReturn
   */
  export type OrderUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * The data used to update Orders.
     */
    data: XOR<OrderUpdateManyMutationInput, OrderUncheckedUpdateManyInput>
    /**
     * Filter which Orders to update
     */
    where?: OrderWhereInput
    /**
     * Limit how many Orders to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Order upsert
   */
  export type OrderUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    /**
     * The filter to search for the Order to update in case it exists.
     */
    where: OrderWhereUniqueInput
    /**
     * In case the Order found by the `where` argument doesn't exist, create a new Order with this data.
     */
    create: XOR<OrderCreateInput, OrderUncheckedCreateInput>
    /**
     * In case the Order was found with the provided `where` argument, update it with this data.
     */
    update: XOR<OrderUpdateInput, OrderUncheckedUpdateInput>
  }

  /**
   * Order delete
   */
  export type OrderDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    /**
     * Filter which Order to delete.
     */
    where: OrderWhereUniqueInput
  }

  /**
   * Order deleteMany
   */
  export type OrderDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Orders to delete
     */
    where?: OrderWhereInput
    /**
     * Limit how many Orders to delete.
     */
    limit?: number
  }

  /**
   * Order.address
   */
  export type Order$addressArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Address
     */
    select?: AddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Address
     */
    omit?: AddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AddressInclude<ExtArgs> | null
    where?: AddressWhereInput
  }

  /**
   * Order.orderProducts
   */
  export type Order$orderProductsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderProducts
     */
    select?: OrderProductsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderProducts
     */
    omit?: OrderProductsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderProductsInclude<ExtArgs> | null
    where?: OrderProductsWhereInput
    orderBy?: OrderProductsOrderByWithRelationInput | OrderProductsOrderByWithRelationInput[]
    cursor?: OrderProductsWhereUniqueInput
    take?: number
    skip?: number
    distinct?: OrderProductsScalarFieldEnum | OrderProductsScalarFieldEnum[]
  }

  /**
   * Order without action
   */
  export type OrderDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
  }


  /**
   * Model OrderProducts
   */

  export type AggregateOrderProducts = {
    _count: OrderProductsCountAggregateOutputType | null
    _avg: OrderProductsAvgAggregateOutputType | null
    _sum: OrderProductsSumAggregateOutputType | null
    _min: OrderProductsMinAggregateOutputType | null
    _max: OrderProductsMaxAggregateOutputType | null
  }

  export type OrderProductsAvgAggregateOutputType = {
    quantity: number | null
    fullAmount: number | null
    amount: number | null
  }

  export type OrderProductsSumAggregateOutputType = {
    quantity: number | null
    fullAmount: number | null
    amount: number | null
  }

  export type OrderProductsMinAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    productId: string | null
    quantity: number | null
    fullAmount: number | null
    amount: number | null
    orderId: string | null
  }

  export type OrderProductsMaxAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    productId: string | null
    quantity: number | null
    fullAmount: number | null
    amount: number | null
    orderId: string | null
  }

  export type OrderProductsCountAggregateOutputType = {
    id: number
    createdAt: number
    productId: number
    quantity: number
    fullAmount: number
    amount: number
    orderId: number
    _all: number
  }


  export type OrderProductsAvgAggregateInputType = {
    quantity?: true
    fullAmount?: true
    amount?: true
  }

  export type OrderProductsSumAggregateInputType = {
    quantity?: true
    fullAmount?: true
    amount?: true
  }

  export type OrderProductsMinAggregateInputType = {
    id?: true
    createdAt?: true
    productId?: true
    quantity?: true
    fullAmount?: true
    amount?: true
    orderId?: true
  }

  export type OrderProductsMaxAggregateInputType = {
    id?: true
    createdAt?: true
    productId?: true
    quantity?: true
    fullAmount?: true
    amount?: true
    orderId?: true
  }

  export type OrderProductsCountAggregateInputType = {
    id?: true
    createdAt?: true
    productId?: true
    quantity?: true
    fullAmount?: true
    amount?: true
    orderId?: true
    _all?: true
  }

  export type OrderProductsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which OrderProducts to aggregate.
     */
    where?: OrderProductsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OrderProducts to fetch.
     */
    orderBy?: OrderProductsOrderByWithRelationInput | OrderProductsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: OrderProductsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OrderProducts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OrderProducts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned OrderProducts
    **/
    _count?: true | OrderProductsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: OrderProductsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: OrderProductsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: OrderProductsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: OrderProductsMaxAggregateInputType
  }

  export type GetOrderProductsAggregateType<T extends OrderProductsAggregateArgs> = {
        [P in keyof T & keyof AggregateOrderProducts]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateOrderProducts[P]>
      : GetScalarType<T[P], AggregateOrderProducts[P]>
  }




  export type OrderProductsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OrderProductsWhereInput
    orderBy?: OrderProductsOrderByWithAggregationInput | OrderProductsOrderByWithAggregationInput[]
    by: OrderProductsScalarFieldEnum[] | OrderProductsScalarFieldEnum
    having?: OrderProductsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: OrderProductsCountAggregateInputType | true
    _avg?: OrderProductsAvgAggregateInputType
    _sum?: OrderProductsSumAggregateInputType
    _min?: OrderProductsMinAggregateInputType
    _max?: OrderProductsMaxAggregateInputType
  }

  export type OrderProductsGroupByOutputType = {
    id: string
    createdAt: Date
    productId: string
    quantity: number
    fullAmount: number
    amount: number
    orderId: string | null
    _count: OrderProductsCountAggregateOutputType | null
    _avg: OrderProductsAvgAggregateOutputType | null
    _sum: OrderProductsSumAggregateOutputType | null
    _min: OrderProductsMinAggregateOutputType | null
    _max: OrderProductsMaxAggregateOutputType | null
  }

  type GetOrderProductsGroupByPayload<T extends OrderProductsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<OrderProductsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof OrderProductsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], OrderProductsGroupByOutputType[P]>
            : GetScalarType<T[P], OrderProductsGroupByOutputType[P]>
        }
      >
    >


  export type OrderProductsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    productId?: boolean
    quantity?: boolean
    fullAmount?: boolean
    amount?: boolean
    orderId?: boolean
    product?: boolean | ProductDefaultArgs<ExtArgs>
    order?: boolean | OrderProducts$orderArgs<ExtArgs>
  }, ExtArgs["result"]["orderProducts"]>

  export type OrderProductsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    productId?: boolean
    quantity?: boolean
    fullAmount?: boolean
    amount?: boolean
    orderId?: boolean
    product?: boolean | ProductDefaultArgs<ExtArgs>
    order?: boolean | OrderProducts$orderArgs<ExtArgs>
  }, ExtArgs["result"]["orderProducts"]>

  export type OrderProductsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    productId?: boolean
    quantity?: boolean
    fullAmount?: boolean
    amount?: boolean
    orderId?: boolean
    product?: boolean | ProductDefaultArgs<ExtArgs>
    order?: boolean | OrderProducts$orderArgs<ExtArgs>
  }, ExtArgs["result"]["orderProducts"]>

  export type OrderProductsSelectScalar = {
    id?: boolean
    createdAt?: boolean
    productId?: boolean
    quantity?: boolean
    fullAmount?: boolean
    amount?: boolean
    orderId?: boolean
  }

  export type OrderProductsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "productId" | "quantity" | "fullAmount" | "amount" | "orderId", ExtArgs["result"]["orderProducts"]>
  export type OrderProductsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | ProductDefaultArgs<ExtArgs>
    order?: boolean | OrderProducts$orderArgs<ExtArgs>
  }
  export type OrderProductsIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | ProductDefaultArgs<ExtArgs>
    order?: boolean | OrderProducts$orderArgs<ExtArgs>
  }
  export type OrderProductsIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | ProductDefaultArgs<ExtArgs>
    order?: boolean | OrderProducts$orderArgs<ExtArgs>
  }

  export type $OrderProductsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "OrderProducts"
    objects: {
      product: Prisma.$ProductPayload<ExtArgs>
      order: Prisma.$OrderPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      createdAt: Date
      productId: string
      quantity: number
      fullAmount: number
      amount: number
      orderId: string | null
    }, ExtArgs["result"]["orderProducts"]>
    composites: {}
  }

  type OrderProductsGetPayload<S extends boolean | null | undefined | OrderProductsDefaultArgs> = $Result.GetResult<Prisma.$OrderProductsPayload, S>

  type OrderProductsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<OrderProductsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: OrderProductsCountAggregateInputType | true
    }

  export interface OrderProductsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['OrderProducts'], meta: { name: 'OrderProducts' } }
    /**
     * Find zero or one OrderProducts that matches the filter.
     * @param {OrderProductsFindUniqueArgs} args - Arguments to find a OrderProducts
     * @example
     * // Get one OrderProducts
     * const orderProducts = await prisma.orderProducts.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends OrderProductsFindUniqueArgs>(args: SelectSubset<T, OrderProductsFindUniqueArgs<ExtArgs>>): Prisma__OrderProductsClient<$Result.GetResult<Prisma.$OrderProductsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one OrderProducts that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {OrderProductsFindUniqueOrThrowArgs} args - Arguments to find a OrderProducts
     * @example
     * // Get one OrderProducts
     * const orderProducts = await prisma.orderProducts.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends OrderProductsFindUniqueOrThrowArgs>(args: SelectSubset<T, OrderProductsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__OrderProductsClient<$Result.GetResult<Prisma.$OrderProductsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first OrderProducts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderProductsFindFirstArgs} args - Arguments to find a OrderProducts
     * @example
     * // Get one OrderProducts
     * const orderProducts = await prisma.orderProducts.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends OrderProductsFindFirstArgs>(args?: SelectSubset<T, OrderProductsFindFirstArgs<ExtArgs>>): Prisma__OrderProductsClient<$Result.GetResult<Prisma.$OrderProductsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first OrderProducts that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderProductsFindFirstOrThrowArgs} args - Arguments to find a OrderProducts
     * @example
     * // Get one OrderProducts
     * const orderProducts = await prisma.orderProducts.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends OrderProductsFindFirstOrThrowArgs>(args?: SelectSubset<T, OrderProductsFindFirstOrThrowArgs<ExtArgs>>): Prisma__OrderProductsClient<$Result.GetResult<Prisma.$OrderProductsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more OrderProducts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderProductsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all OrderProducts
     * const orderProducts = await prisma.orderProducts.findMany()
     * 
     * // Get first 10 OrderProducts
     * const orderProducts = await prisma.orderProducts.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const orderProductsWithIdOnly = await prisma.orderProducts.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends OrderProductsFindManyArgs>(args?: SelectSubset<T, OrderProductsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrderProductsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a OrderProducts.
     * @param {OrderProductsCreateArgs} args - Arguments to create a OrderProducts.
     * @example
     * // Create one OrderProducts
     * const OrderProducts = await prisma.orderProducts.create({
     *   data: {
     *     // ... data to create a OrderProducts
     *   }
     * })
     * 
     */
    create<T extends OrderProductsCreateArgs>(args: SelectSubset<T, OrderProductsCreateArgs<ExtArgs>>): Prisma__OrderProductsClient<$Result.GetResult<Prisma.$OrderProductsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many OrderProducts.
     * @param {OrderProductsCreateManyArgs} args - Arguments to create many OrderProducts.
     * @example
     * // Create many OrderProducts
     * const orderProducts = await prisma.orderProducts.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends OrderProductsCreateManyArgs>(args?: SelectSubset<T, OrderProductsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many OrderProducts and returns the data saved in the database.
     * @param {OrderProductsCreateManyAndReturnArgs} args - Arguments to create many OrderProducts.
     * @example
     * // Create many OrderProducts
     * const orderProducts = await prisma.orderProducts.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many OrderProducts and only return the `id`
     * const orderProductsWithIdOnly = await prisma.orderProducts.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends OrderProductsCreateManyAndReturnArgs>(args?: SelectSubset<T, OrderProductsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrderProductsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a OrderProducts.
     * @param {OrderProductsDeleteArgs} args - Arguments to delete one OrderProducts.
     * @example
     * // Delete one OrderProducts
     * const OrderProducts = await prisma.orderProducts.delete({
     *   where: {
     *     // ... filter to delete one OrderProducts
     *   }
     * })
     * 
     */
    delete<T extends OrderProductsDeleteArgs>(args: SelectSubset<T, OrderProductsDeleteArgs<ExtArgs>>): Prisma__OrderProductsClient<$Result.GetResult<Prisma.$OrderProductsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one OrderProducts.
     * @param {OrderProductsUpdateArgs} args - Arguments to update one OrderProducts.
     * @example
     * // Update one OrderProducts
     * const orderProducts = await prisma.orderProducts.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends OrderProductsUpdateArgs>(args: SelectSubset<T, OrderProductsUpdateArgs<ExtArgs>>): Prisma__OrderProductsClient<$Result.GetResult<Prisma.$OrderProductsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more OrderProducts.
     * @param {OrderProductsDeleteManyArgs} args - Arguments to filter OrderProducts to delete.
     * @example
     * // Delete a few OrderProducts
     * const { count } = await prisma.orderProducts.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends OrderProductsDeleteManyArgs>(args?: SelectSubset<T, OrderProductsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more OrderProducts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderProductsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many OrderProducts
     * const orderProducts = await prisma.orderProducts.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends OrderProductsUpdateManyArgs>(args: SelectSubset<T, OrderProductsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more OrderProducts and returns the data updated in the database.
     * @param {OrderProductsUpdateManyAndReturnArgs} args - Arguments to update many OrderProducts.
     * @example
     * // Update many OrderProducts
     * const orderProducts = await prisma.orderProducts.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more OrderProducts and only return the `id`
     * const orderProductsWithIdOnly = await prisma.orderProducts.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends OrderProductsUpdateManyAndReturnArgs>(args: SelectSubset<T, OrderProductsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OrderProductsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one OrderProducts.
     * @param {OrderProductsUpsertArgs} args - Arguments to update or create a OrderProducts.
     * @example
     * // Update or create a OrderProducts
     * const orderProducts = await prisma.orderProducts.upsert({
     *   create: {
     *     // ... data to create a OrderProducts
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the OrderProducts we want to update
     *   }
     * })
     */
    upsert<T extends OrderProductsUpsertArgs>(args: SelectSubset<T, OrderProductsUpsertArgs<ExtArgs>>): Prisma__OrderProductsClient<$Result.GetResult<Prisma.$OrderProductsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of OrderProducts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderProductsCountArgs} args - Arguments to filter OrderProducts to count.
     * @example
     * // Count the number of OrderProducts
     * const count = await prisma.orderProducts.count({
     *   where: {
     *     // ... the filter for the OrderProducts we want to count
     *   }
     * })
    **/
    count<T extends OrderProductsCountArgs>(
      args?: Subset<T, OrderProductsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], OrderProductsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a OrderProducts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderProductsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends OrderProductsAggregateArgs>(args: Subset<T, OrderProductsAggregateArgs>): Prisma.PrismaPromise<GetOrderProductsAggregateType<T>>

    /**
     * Group by OrderProducts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OrderProductsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends OrderProductsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: OrderProductsGroupByArgs['orderBy'] }
        : { orderBy?: OrderProductsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, OrderProductsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOrderProductsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the OrderProducts model
   */
  readonly fields: OrderProductsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for OrderProducts.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__OrderProductsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    product<T extends ProductDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProductDefaultArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    order<T extends OrderProducts$orderArgs<ExtArgs> = {}>(args?: Subset<T, OrderProducts$orderArgs<ExtArgs>>): Prisma__OrderClient<$Result.GetResult<Prisma.$OrderPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the OrderProducts model
   */
  interface OrderProductsFieldRefs {
    readonly id: FieldRef<"OrderProducts", 'String'>
    readonly createdAt: FieldRef<"OrderProducts", 'DateTime'>
    readonly productId: FieldRef<"OrderProducts", 'String'>
    readonly quantity: FieldRef<"OrderProducts", 'Int'>
    readonly fullAmount: FieldRef<"OrderProducts", 'Int'>
    readonly amount: FieldRef<"OrderProducts", 'Int'>
    readonly orderId: FieldRef<"OrderProducts", 'String'>
  }
    

  // Custom InputTypes
  /**
   * OrderProducts findUnique
   */
  export type OrderProductsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderProducts
     */
    select?: OrderProductsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderProducts
     */
    omit?: OrderProductsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderProductsInclude<ExtArgs> | null
    /**
     * Filter, which OrderProducts to fetch.
     */
    where: OrderProductsWhereUniqueInput
  }

  /**
   * OrderProducts findUniqueOrThrow
   */
  export type OrderProductsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderProducts
     */
    select?: OrderProductsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderProducts
     */
    omit?: OrderProductsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderProductsInclude<ExtArgs> | null
    /**
     * Filter, which OrderProducts to fetch.
     */
    where: OrderProductsWhereUniqueInput
  }

  /**
   * OrderProducts findFirst
   */
  export type OrderProductsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderProducts
     */
    select?: OrderProductsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderProducts
     */
    omit?: OrderProductsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderProductsInclude<ExtArgs> | null
    /**
     * Filter, which OrderProducts to fetch.
     */
    where?: OrderProductsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OrderProducts to fetch.
     */
    orderBy?: OrderProductsOrderByWithRelationInput | OrderProductsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for OrderProducts.
     */
    cursor?: OrderProductsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OrderProducts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OrderProducts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of OrderProducts.
     */
    distinct?: OrderProductsScalarFieldEnum | OrderProductsScalarFieldEnum[]
  }

  /**
   * OrderProducts findFirstOrThrow
   */
  export type OrderProductsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderProducts
     */
    select?: OrderProductsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderProducts
     */
    omit?: OrderProductsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderProductsInclude<ExtArgs> | null
    /**
     * Filter, which OrderProducts to fetch.
     */
    where?: OrderProductsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OrderProducts to fetch.
     */
    orderBy?: OrderProductsOrderByWithRelationInput | OrderProductsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for OrderProducts.
     */
    cursor?: OrderProductsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OrderProducts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OrderProducts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of OrderProducts.
     */
    distinct?: OrderProductsScalarFieldEnum | OrderProductsScalarFieldEnum[]
  }

  /**
   * OrderProducts findMany
   */
  export type OrderProductsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderProducts
     */
    select?: OrderProductsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderProducts
     */
    omit?: OrderProductsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderProductsInclude<ExtArgs> | null
    /**
     * Filter, which OrderProducts to fetch.
     */
    where?: OrderProductsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OrderProducts to fetch.
     */
    orderBy?: OrderProductsOrderByWithRelationInput | OrderProductsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing OrderProducts.
     */
    cursor?: OrderProductsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OrderProducts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OrderProducts.
     */
    skip?: number
    distinct?: OrderProductsScalarFieldEnum | OrderProductsScalarFieldEnum[]
  }

  /**
   * OrderProducts create
   */
  export type OrderProductsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderProducts
     */
    select?: OrderProductsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderProducts
     */
    omit?: OrderProductsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderProductsInclude<ExtArgs> | null
    /**
     * The data needed to create a OrderProducts.
     */
    data: XOR<OrderProductsCreateInput, OrderProductsUncheckedCreateInput>
  }

  /**
   * OrderProducts createMany
   */
  export type OrderProductsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many OrderProducts.
     */
    data: OrderProductsCreateManyInput | OrderProductsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * OrderProducts createManyAndReturn
   */
  export type OrderProductsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderProducts
     */
    select?: OrderProductsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the OrderProducts
     */
    omit?: OrderProductsOmit<ExtArgs> | null
    /**
     * The data used to create many OrderProducts.
     */
    data: OrderProductsCreateManyInput | OrderProductsCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderProductsIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * OrderProducts update
   */
  export type OrderProductsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderProducts
     */
    select?: OrderProductsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderProducts
     */
    omit?: OrderProductsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderProductsInclude<ExtArgs> | null
    /**
     * The data needed to update a OrderProducts.
     */
    data: XOR<OrderProductsUpdateInput, OrderProductsUncheckedUpdateInput>
    /**
     * Choose, which OrderProducts to update.
     */
    where: OrderProductsWhereUniqueInput
  }

  /**
   * OrderProducts updateMany
   */
  export type OrderProductsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update OrderProducts.
     */
    data: XOR<OrderProductsUpdateManyMutationInput, OrderProductsUncheckedUpdateManyInput>
    /**
     * Filter which OrderProducts to update
     */
    where?: OrderProductsWhereInput
    /**
     * Limit how many OrderProducts to update.
     */
    limit?: number
  }

  /**
   * OrderProducts updateManyAndReturn
   */
  export type OrderProductsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderProducts
     */
    select?: OrderProductsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the OrderProducts
     */
    omit?: OrderProductsOmit<ExtArgs> | null
    /**
     * The data used to update OrderProducts.
     */
    data: XOR<OrderProductsUpdateManyMutationInput, OrderProductsUncheckedUpdateManyInput>
    /**
     * Filter which OrderProducts to update
     */
    where?: OrderProductsWhereInput
    /**
     * Limit how many OrderProducts to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderProductsIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * OrderProducts upsert
   */
  export type OrderProductsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderProducts
     */
    select?: OrderProductsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderProducts
     */
    omit?: OrderProductsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderProductsInclude<ExtArgs> | null
    /**
     * The filter to search for the OrderProducts to update in case it exists.
     */
    where: OrderProductsWhereUniqueInput
    /**
     * In case the OrderProducts found by the `where` argument doesn't exist, create a new OrderProducts with this data.
     */
    create: XOR<OrderProductsCreateInput, OrderProductsUncheckedCreateInput>
    /**
     * In case the OrderProducts was found with the provided `where` argument, update it with this data.
     */
    update: XOR<OrderProductsUpdateInput, OrderProductsUncheckedUpdateInput>
  }

  /**
   * OrderProducts delete
   */
  export type OrderProductsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderProducts
     */
    select?: OrderProductsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderProducts
     */
    omit?: OrderProductsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderProductsInclude<ExtArgs> | null
    /**
     * Filter which OrderProducts to delete.
     */
    where: OrderProductsWhereUniqueInput
  }

  /**
   * OrderProducts deleteMany
   */
  export type OrderProductsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which OrderProducts to delete
     */
    where?: OrderProductsWhereInput
    /**
     * Limit how many OrderProducts to delete.
     */
    limit?: number
  }

  /**
   * OrderProducts.order
   */
  export type OrderProducts$orderArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Order
     */
    select?: OrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Order
     */
    omit?: OrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderInclude<ExtArgs> | null
    where?: OrderWhereInput
  }

  /**
   * OrderProducts without action
   */
  export type OrderProductsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderProducts
     */
    select?: OrderProductsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OrderProducts
     */
    omit?: OrderProductsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OrderProductsInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const ProgressiveDiscountScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt'
  };

  export type ProgressiveDiscountScalarFieldEnum = (typeof ProgressiveDiscountScalarFieldEnum)[keyof typeof ProgressiveDiscountScalarFieldEnum]


  export const ProgressiveDiscountStepScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    amount: 'amount',
    discount: 'discount',
    discountType: 'discountType',
    progressiveDiscountId: 'progressiveDiscountId'
  };

  export type ProgressiveDiscountStepScalarFieldEnum = (typeof ProgressiveDiscountStepScalarFieldEnum)[keyof typeof ProgressiveDiscountStepScalarFieldEnum]


  export const FileScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    name: 'name',
    url: 'url',
    size: 'size',
    productId: 'productId'
  };

  export type FileScalarFieldEnum = (typeof FileScalarFieldEnum)[keyof typeof FileScalarFieldEnum]


  export const ModifierGroupScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    title: 'title',
    required: 'required',
    type: 'type',
    productId: 'productId',
    minSelection: 'minSelection',
    maxSelection: 'maxSelection'
  };

  export type ModifierGroupScalarFieldEnum = (typeof ModifierGroupScalarFieldEnum)[keyof typeof ModifierGroupScalarFieldEnum]


  export const BusinessScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    name: 'name'
  };

  export type BusinessScalarFieldEnum = (typeof BusinessScalarFieldEnum)[keyof typeof BusinessScalarFieldEnum]


  export const BranchScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    name: 'name',
    addressId: 'addressId',
    businessId: 'businessId'
  };

  export type BranchScalarFieldEnum = (typeof BranchScalarFieldEnum)[keyof typeof BranchScalarFieldEnum]


  export const AddressScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    description: 'description',
    googleMapsUrl: 'googleMapsUrl'
  };

  export type AddressScalarFieldEnum = (typeof AddressScalarFieldEnum)[keyof typeof AddressScalarFieldEnum]


  export const ProductScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    name: 'name',
    description: 'description',
    price: 'price',
    comparedAtPrice: 'comparedAtPrice',
    categoryId: 'categoryId'
  };

  export type ProductScalarFieldEnum = (typeof ProductScalarFieldEnum)[keyof typeof ProductScalarFieldEnum]


  export const CategoryScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    name: 'name'
  };

  export type CategoryScalarFieldEnum = (typeof CategoryScalarFieldEnum)[keyof typeof CategoryScalarFieldEnum]


  export const CampaignScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    startedAt: 'startedAt'
  };

  export type CampaignScalarFieldEnum = (typeof CampaignScalarFieldEnum)[keyof typeof CampaignScalarFieldEnum]


  export const CustomerScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    name: 'name',
    email: 'email',
    phone: 'phone',
    address: 'address',
    lastMessageSent: 'lastMessageSent'
  };

  export type CustomerScalarFieldEnum = (typeof CustomerScalarFieldEnum)[keyof typeof CustomerScalarFieldEnum]


  export const DeliveryAddressScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    lat: 'lat',
    lng: 'lng',
    city: 'city',
    zipCode: 'zipCode',
    State: 'State',
    street: 'street',
    number: 'number',
    description: 'description',
    complement: 'complement',
    numberComplement: 'numberComplement',
    customerId: 'customerId'
  };

  export type DeliveryAddressScalarFieldEnum = (typeof DeliveryAddressScalarFieldEnum)[keyof typeof DeliveryAddressScalarFieldEnum]


  export const MessageScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    name: 'name',
    content: 'content',
    media: 'media'
  };

  export type MessageScalarFieldEnum = (typeof MessageScalarFieldEnum)[keyof typeof MessageScalarFieldEnum]


  export const PromotialMessageScalarFieldEnum: {
    id: 'id',
    sentAt: 'sentAt',
    campaignId: 'campaignId',
    messageId: 'messageId',
    customerId: 'customerId'
  };

  export type PromotialMessageScalarFieldEnum = (typeof PromotialMessageScalarFieldEnum)[keyof typeof PromotialMessageScalarFieldEnum]


  export const OrderScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    amount: 'amount',
    type: 'type',
    paymentMethod: 'paymentMethod',
    tipAmount: 'tipAmount',
    customerId: 'customerId',
    externalId: 'externalId',
    addressId: 'addressId'
  };

  export type OrderScalarFieldEnum = (typeof OrderScalarFieldEnum)[keyof typeof OrderScalarFieldEnum]


  export const OrderProductsScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    productId: 'productId',
    quantity: 'quantity',
    fullAmount: 'fullAmount',
    amount: 'amount',
    orderId: 'orderId'
  };

  export type OrderProductsScalarFieldEnum = (typeof OrderProductsScalarFieldEnum)[keyof typeof OrderProductsScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'ProgressiveDiscountStepType'
   */
  export type EnumProgressiveDiscountStepTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProgressiveDiscountStepType'>
    


  /**
   * Reference to a field of type 'ProgressiveDiscountStepType[]'
   */
  export type ListEnumProgressiveDiscountStepTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProgressiveDiscountStepType[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'ModifierGroupType'
   */
  export type EnumModifierGroupTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ModifierGroupType'>
    


  /**
   * Reference to a field of type 'ModifierGroupType[]'
   */
  export type ListEnumModifierGroupTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ModifierGroupType[]'>
    


  /**
   * Reference to a field of type 'OrderType'
   */
  export type EnumOrderTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'OrderType'>
    


  /**
   * Reference to a field of type 'OrderType[]'
   */
  export type ListEnumOrderTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'OrderType[]'>
    


  /**
   * Reference to a field of type 'PaymentType'
   */
  export type EnumPaymentTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentType'>
    


  /**
   * Reference to a field of type 'PaymentType[]'
   */
  export type ListEnumPaymentTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentType[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type ProgressiveDiscountWhereInput = {
    AND?: ProgressiveDiscountWhereInput | ProgressiveDiscountWhereInput[]
    OR?: ProgressiveDiscountWhereInput[]
    NOT?: ProgressiveDiscountWhereInput | ProgressiveDiscountWhereInput[]
    id?: StringFilter<"ProgressiveDiscount"> | string
    createdAt?: DateTimeFilter<"ProgressiveDiscount"> | Date | string
    steps?: ProgressiveDiscountStepListRelationFilter
  }

  export type ProgressiveDiscountOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    steps?: ProgressiveDiscountStepOrderByRelationAggregateInput
  }

  export type ProgressiveDiscountWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ProgressiveDiscountWhereInput | ProgressiveDiscountWhereInput[]
    OR?: ProgressiveDiscountWhereInput[]
    NOT?: ProgressiveDiscountWhereInput | ProgressiveDiscountWhereInput[]
    createdAt?: DateTimeFilter<"ProgressiveDiscount"> | Date | string
    steps?: ProgressiveDiscountStepListRelationFilter
  }, "id">

  export type ProgressiveDiscountOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    _count?: ProgressiveDiscountCountOrderByAggregateInput
    _max?: ProgressiveDiscountMaxOrderByAggregateInput
    _min?: ProgressiveDiscountMinOrderByAggregateInput
  }

  export type ProgressiveDiscountScalarWhereWithAggregatesInput = {
    AND?: ProgressiveDiscountScalarWhereWithAggregatesInput | ProgressiveDiscountScalarWhereWithAggregatesInput[]
    OR?: ProgressiveDiscountScalarWhereWithAggregatesInput[]
    NOT?: ProgressiveDiscountScalarWhereWithAggregatesInput | ProgressiveDiscountScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ProgressiveDiscount"> | string
    createdAt?: DateTimeWithAggregatesFilter<"ProgressiveDiscount"> | Date | string
  }

  export type ProgressiveDiscountStepWhereInput = {
    AND?: ProgressiveDiscountStepWhereInput | ProgressiveDiscountStepWhereInput[]
    OR?: ProgressiveDiscountStepWhereInput[]
    NOT?: ProgressiveDiscountStepWhereInput | ProgressiveDiscountStepWhereInput[]
    id?: StringFilter<"ProgressiveDiscountStep"> | string
    createdAt?: DateTimeFilter<"ProgressiveDiscountStep"> | Date | string
    amount?: IntFilter<"ProgressiveDiscountStep"> | number
    discount?: IntNullableFilter<"ProgressiveDiscountStep"> | number | null
    discountType?: EnumProgressiveDiscountStepTypeFilter<"ProgressiveDiscountStep"> | $Enums.ProgressiveDiscountStepType
    progressiveDiscountId?: StringFilter<"ProgressiveDiscountStep"> | string
    progressiveDiscount?: XOR<ProgressiveDiscountScalarRelationFilter, ProgressiveDiscountWhereInput>
  }

  export type ProgressiveDiscountStepOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    amount?: SortOrder
    discount?: SortOrderInput | SortOrder
    discountType?: SortOrder
    progressiveDiscountId?: SortOrder
    progressiveDiscount?: ProgressiveDiscountOrderByWithRelationInput
  }

  export type ProgressiveDiscountStepWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ProgressiveDiscountStepWhereInput | ProgressiveDiscountStepWhereInput[]
    OR?: ProgressiveDiscountStepWhereInput[]
    NOT?: ProgressiveDiscountStepWhereInput | ProgressiveDiscountStepWhereInput[]
    createdAt?: DateTimeFilter<"ProgressiveDiscountStep"> | Date | string
    amount?: IntFilter<"ProgressiveDiscountStep"> | number
    discount?: IntNullableFilter<"ProgressiveDiscountStep"> | number | null
    discountType?: EnumProgressiveDiscountStepTypeFilter<"ProgressiveDiscountStep"> | $Enums.ProgressiveDiscountStepType
    progressiveDiscountId?: StringFilter<"ProgressiveDiscountStep"> | string
    progressiveDiscount?: XOR<ProgressiveDiscountScalarRelationFilter, ProgressiveDiscountWhereInput>
  }, "id">

  export type ProgressiveDiscountStepOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    amount?: SortOrder
    discount?: SortOrderInput | SortOrder
    discountType?: SortOrder
    progressiveDiscountId?: SortOrder
    _count?: ProgressiveDiscountStepCountOrderByAggregateInput
    _avg?: ProgressiveDiscountStepAvgOrderByAggregateInput
    _max?: ProgressiveDiscountStepMaxOrderByAggregateInput
    _min?: ProgressiveDiscountStepMinOrderByAggregateInput
    _sum?: ProgressiveDiscountStepSumOrderByAggregateInput
  }

  export type ProgressiveDiscountStepScalarWhereWithAggregatesInput = {
    AND?: ProgressiveDiscountStepScalarWhereWithAggregatesInput | ProgressiveDiscountStepScalarWhereWithAggregatesInput[]
    OR?: ProgressiveDiscountStepScalarWhereWithAggregatesInput[]
    NOT?: ProgressiveDiscountStepScalarWhereWithAggregatesInput | ProgressiveDiscountStepScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ProgressiveDiscountStep"> | string
    createdAt?: DateTimeWithAggregatesFilter<"ProgressiveDiscountStep"> | Date | string
    amount?: IntWithAggregatesFilter<"ProgressiveDiscountStep"> | number
    discount?: IntNullableWithAggregatesFilter<"ProgressiveDiscountStep"> | number | null
    discountType?: EnumProgressiveDiscountStepTypeWithAggregatesFilter<"ProgressiveDiscountStep"> | $Enums.ProgressiveDiscountStepType
    progressiveDiscountId?: StringWithAggregatesFilter<"ProgressiveDiscountStep"> | string
  }

  export type FileWhereInput = {
    AND?: FileWhereInput | FileWhereInput[]
    OR?: FileWhereInput[]
    NOT?: FileWhereInput | FileWhereInput[]
    id?: StringFilter<"File"> | string
    createdAt?: DateTimeFilter<"File"> | Date | string
    name?: StringFilter<"File"> | string
    url?: StringFilter<"File"> | string
    size?: IntFilter<"File"> | number
    productId?: StringNullableFilter<"File"> | string | null
    product?: XOR<ProductNullableScalarRelationFilter, ProductWhereInput> | null
  }

  export type FileOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    url?: SortOrder
    size?: SortOrder
    productId?: SortOrderInput | SortOrder
    product?: ProductOrderByWithRelationInput
  }

  export type FileWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: FileWhereInput | FileWhereInput[]
    OR?: FileWhereInput[]
    NOT?: FileWhereInput | FileWhereInput[]
    createdAt?: DateTimeFilter<"File"> | Date | string
    name?: StringFilter<"File"> | string
    url?: StringFilter<"File"> | string
    size?: IntFilter<"File"> | number
    productId?: StringNullableFilter<"File"> | string | null
    product?: XOR<ProductNullableScalarRelationFilter, ProductWhereInput> | null
  }, "id">

  export type FileOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    url?: SortOrder
    size?: SortOrder
    productId?: SortOrderInput | SortOrder
    _count?: FileCountOrderByAggregateInput
    _avg?: FileAvgOrderByAggregateInput
    _max?: FileMaxOrderByAggregateInput
    _min?: FileMinOrderByAggregateInput
    _sum?: FileSumOrderByAggregateInput
  }

  export type FileScalarWhereWithAggregatesInput = {
    AND?: FileScalarWhereWithAggregatesInput | FileScalarWhereWithAggregatesInput[]
    OR?: FileScalarWhereWithAggregatesInput[]
    NOT?: FileScalarWhereWithAggregatesInput | FileScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"File"> | string
    createdAt?: DateTimeWithAggregatesFilter<"File"> | Date | string
    name?: StringWithAggregatesFilter<"File"> | string
    url?: StringWithAggregatesFilter<"File"> | string
    size?: IntWithAggregatesFilter<"File"> | number
    productId?: StringNullableWithAggregatesFilter<"File"> | string | null
  }

  export type ModifierGroupWhereInput = {
    AND?: ModifierGroupWhereInput | ModifierGroupWhereInput[]
    OR?: ModifierGroupWhereInput[]
    NOT?: ModifierGroupWhereInput | ModifierGroupWhereInput[]
    id?: StringFilter<"ModifierGroup"> | string
    createdAt?: DateTimeFilter<"ModifierGroup"> | Date | string
    title?: StringFilter<"ModifierGroup"> | string
    required?: BoolFilter<"ModifierGroup"> | boolean
    type?: EnumModifierGroupTypeNullableFilter<"ModifierGroup"> | $Enums.ModifierGroupType | null
    productId?: StringNullableFilter<"ModifierGroup"> | string | null
    minSelection?: IntNullableFilter<"ModifierGroup"> | number | null
    maxSelection?: IntNullableFilter<"ModifierGroup"> | number | null
    product?: XOR<ProductNullableScalarRelationFilter, ProductWhereInput> | null
  }

  export type ModifierGroupOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    title?: SortOrder
    required?: SortOrder
    type?: SortOrderInput | SortOrder
    productId?: SortOrderInput | SortOrder
    minSelection?: SortOrderInput | SortOrder
    maxSelection?: SortOrderInput | SortOrder
    product?: ProductOrderByWithRelationInput
  }

  export type ModifierGroupWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ModifierGroupWhereInput | ModifierGroupWhereInput[]
    OR?: ModifierGroupWhereInput[]
    NOT?: ModifierGroupWhereInput | ModifierGroupWhereInput[]
    createdAt?: DateTimeFilter<"ModifierGroup"> | Date | string
    title?: StringFilter<"ModifierGroup"> | string
    required?: BoolFilter<"ModifierGroup"> | boolean
    type?: EnumModifierGroupTypeNullableFilter<"ModifierGroup"> | $Enums.ModifierGroupType | null
    productId?: StringNullableFilter<"ModifierGroup"> | string | null
    minSelection?: IntNullableFilter<"ModifierGroup"> | number | null
    maxSelection?: IntNullableFilter<"ModifierGroup"> | number | null
    product?: XOR<ProductNullableScalarRelationFilter, ProductWhereInput> | null
  }, "id">

  export type ModifierGroupOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    title?: SortOrder
    required?: SortOrder
    type?: SortOrderInput | SortOrder
    productId?: SortOrderInput | SortOrder
    minSelection?: SortOrderInput | SortOrder
    maxSelection?: SortOrderInput | SortOrder
    _count?: ModifierGroupCountOrderByAggregateInput
    _avg?: ModifierGroupAvgOrderByAggregateInput
    _max?: ModifierGroupMaxOrderByAggregateInput
    _min?: ModifierGroupMinOrderByAggregateInput
    _sum?: ModifierGroupSumOrderByAggregateInput
  }

  export type ModifierGroupScalarWhereWithAggregatesInput = {
    AND?: ModifierGroupScalarWhereWithAggregatesInput | ModifierGroupScalarWhereWithAggregatesInput[]
    OR?: ModifierGroupScalarWhereWithAggregatesInput[]
    NOT?: ModifierGroupScalarWhereWithAggregatesInput | ModifierGroupScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ModifierGroup"> | string
    createdAt?: DateTimeWithAggregatesFilter<"ModifierGroup"> | Date | string
    title?: StringWithAggregatesFilter<"ModifierGroup"> | string
    required?: BoolWithAggregatesFilter<"ModifierGroup"> | boolean
    type?: EnumModifierGroupTypeNullableWithAggregatesFilter<"ModifierGroup"> | $Enums.ModifierGroupType | null
    productId?: StringNullableWithAggregatesFilter<"ModifierGroup"> | string | null
    minSelection?: IntNullableWithAggregatesFilter<"ModifierGroup"> | number | null
    maxSelection?: IntNullableWithAggregatesFilter<"ModifierGroup"> | number | null
  }

  export type BusinessWhereInput = {
    AND?: BusinessWhereInput | BusinessWhereInput[]
    OR?: BusinessWhereInput[]
    NOT?: BusinessWhereInput | BusinessWhereInput[]
    id?: StringFilter<"Business"> | string
    createdAt?: DateTimeFilter<"Business"> | Date | string
    name?: StringFilter<"Business"> | string
    branches?: BranchListRelationFilter
  }

  export type BusinessOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    branches?: BranchOrderByRelationAggregateInput
  }

  export type BusinessWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: BusinessWhereInput | BusinessWhereInput[]
    OR?: BusinessWhereInput[]
    NOT?: BusinessWhereInput | BusinessWhereInput[]
    createdAt?: DateTimeFilter<"Business"> | Date | string
    name?: StringFilter<"Business"> | string
    branches?: BranchListRelationFilter
  }, "id">

  export type BusinessOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    _count?: BusinessCountOrderByAggregateInput
    _max?: BusinessMaxOrderByAggregateInput
    _min?: BusinessMinOrderByAggregateInput
  }

  export type BusinessScalarWhereWithAggregatesInput = {
    AND?: BusinessScalarWhereWithAggregatesInput | BusinessScalarWhereWithAggregatesInput[]
    OR?: BusinessScalarWhereWithAggregatesInput[]
    NOT?: BusinessScalarWhereWithAggregatesInput | BusinessScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Business"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Business"> | Date | string
    name?: StringWithAggregatesFilter<"Business"> | string
  }

  export type BranchWhereInput = {
    AND?: BranchWhereInput | BranchWhereInput[]
    OR?: BranchWhereInput[]
    NOT?: BranchWhereInput | BranchWhereInput[]
    id?: StringFilter<"Branch"> | string
    createdAt?: DateTimeFilter<"Branch"> | Date | string
    name?: StringFilter<"Branch"> | string
    addressId?: StringNullableFilter<"Branch"> | string | null
    businessId?: StringNullableFilter<"Branch"> | string | null
    address?: XOR<AddressNullableScalarRelationFilter, AddressWhereInput> | null
    business?: XOR<BusinessNullableScalarRelationFilter, BusinessWhereInput> | null
  }

  export type BranchOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    addressId?: SortOrderInput | SortOrder
    businessId?: SortOrderInput | SortOrder
    address?: AddressOrderByWithRelationInput
    business?: BusinessOrderByWithRelationInput
  }

  export type BranchWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    addressId?: string
    AND?: BranchWhereInput | BranchWhereInput[]
    OR?: BranchWhereInput[]
    NOT?: BranchWhereInput | BranchWhereInput[]
    createdAt?: DateTimeFilter<"Branch"> | Date | string
    name?: StringFilter<"Branch"> | string
    businessId?: StringNullableFilter<"Branch"> | string | null
    address?: XOR<AddressNullableScalarRelationFilter, AddressWhereInput> | null
    business?: XOR<BusinessNullableScalarRelationFilter, BusinessWhereInput> | null
  }, "id" | "addressId">

  export type BranchOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    addressId?: SortOrderInput | SortOrder
    businessId?: SortOrderInput | SortOrder
    _count?: BranchCountOrderByAggregateInput
    _max?: BranchMaxOrderByAggregateInput
    _min?: BranchMinOrderByAggregateInput
  }

  export type BranchScalarWhereWithAggregatesInput = {
    AND?: BranchScalarWhereWithAggregatesInput | BranchScalarWhereWithAggregatesInput[]
    OR?: BranchScalarWhereWithAggregatesInput[]
    NOT?: BranchScalarWhereWithAggregatesInput | BranchScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Branch"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Branch"> | Date | string
    name?: StringWithAggregatesFilter<"Branch"> | string
    addressId?: StringNullableWithAggregatesFilter<"Branch"> | string | null
    businessId?: StringNullableWithAggregatesFilter<"Branch"> | string | null
  }

  export type AddressWhereInput = {
    AND?: AddressWhereInput | AddressWhereInput[]
    OR?: AddressWhereInput[]
    NOT?: AddressWhereInput | AddressWhereInput[]
    id?: StringFilter<"Address"> | string
    createdAt?: DateTimeFilter<"Address"> | Date | string
    description?: StringFilter<"Address"> | string
    googleMapsUrl?: StringFilter<"Address"> | string
    branch?: XOR<BranchNullableScalarRelationFilter, BranchWhereInput> | null
    orders?: OrderListRelationFilter
  }

  export type AddressOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    description?: SortOrder
    googleMapsUrl?: SortOrder
    branch?: BranchOrderByWithRelationInput
    orders?: OrderOrderByRelationAggregateInput
  }

  export type AddressWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AddressWhereInput | AddressWhereInput[]
    OR?: AddressWhereInput[]
    NOT?: AddressWhereInput | AddressWhereInput[]
    createdAt?: DateTimeFilter<"Address"> | Date | string
    description?: StringFilter<"Address"> | string
    googleMapsUrl?: StringFilter<"Address"> | string
    branch?: XOR<BranchNullableScalarRelationFilter, BranchWhereInput> | null
    orders?: OrderListRelationFilter
  }, "id">

  export type AddressOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    description?: SortOrder
    googleMapsUrl?: SortOrder
    _count?: AddressCountOrderByAggregateInput
    _max?: AddressMaxOrderByAggregateInput
    _min?: AddressMinOrderByAggregateInput
  }

  export type AddressScalarWhereWithAggregatesInput = {
    AND?: AddressScalarWhereWithAggregatesInput | AddressScalarWhereWithAggregatesInput[]
    OR?: AddressScalarWhereWithAggregatesInput[]
    NOT?: AddressScalarWhereWithAggregatesInput | AddressScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Address"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Address"> | Date | string
    description?: StringWithAggregatesFilter<"Address"> | string
    googleMapsUrl?: StringWithAggregatesFilter<"Address"> | string
  }

  export type ProductWhereInput = {
    AND?: ProductWhereInput | ProductWhereInput[]
    OR?: ProductWhereInput[]
    NOT?: ProductWhereInput | ProductWhereInput[]
    id?: StringFilter<"Product"> | string
    createdAt?: DateTimeFilter<"Product"> | Date | string
    name?: StringFilter<"Product"> | string
    description?: StringNullableFilter<"Product"> | string | null
    price?: IntNullableFilter<"Product"> | number | null
    comparedAtPrice?: IntNullableFilter<"Product"> | number | null
    categoryId?: StringNullableFilter<"Product"> | string | null
    photos?: FileListRelationFilter
    modifierGroups?: ModifierGroupListRelationFilter
    category?: XOR<CategoryNullableScalarRelationFilter, CategoryWhereInput> | null
    OrderProducts?: OrderProductsListRelationFilter
  }

  export type ProductOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    price?: SortOrderInput | SortOrder
    comparedAtPrice?: SortOrderInput | SortOrder
    categoryId?: SortOrderInput | SortOrder
    photos?: FileOrderByRelationAggregateInput
    modifierGroups?: ModifierGroupOrderByRelationAggregateInput
    category?: CategoryOrderByWithRelationInput
    OrderProducts?: OrderProductsOrderByRelationAggregateInput
  }

  export type ProductWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ProductWhereInput | ProductWhereInput[]
    OR?: ProductWhereInput[]
    NOT?: ProductWhereInput | ProductWhereInput[]
    createdAt?: DateTimeFilter<"Product"> | Date | string
    name?: StringFilter<"Product"> | string
    description?: StringNullableFilter<"Product"> | string | null
    price?: IntNullableFilter<"Product"> | number | null
    comparedAtPrice?: IntNullableFilter<"Product"> | number | null
    categoryId?: StringNullableFilter<"Product"> | string | null
    photos?: FileListRelationFilter
    modifierGroups?: ModifierGroupListRelationFilter
    category?: XOR<CategoryNullableScalarRelationFilter, CategoryWhereInput> | null
    OrderProducts?: OrderProductsListRelationFilter
  }, "id">

  export type ProductOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    price?: SortOrderInput | SortOrder
    comparedAtPrice?: SortOrderInput | SortOrder
    categoryId?: SortOrderInput | SortOrder
    _count?: ProductCountOrderByAggregateInput
    _avg?: ProductAvgOrderByAggregateInput
    _max?: ProductMaxOrderByAggregateInput
    _min?: ProductMinOrderByAggregateInput
    _sum?: ProductSumOrderByAggregateInput
  }

  export type ProductScalarWhereWithAggregatesInput = {
    AND?: ProductScalarWhereWithAggregatesInput | ProductScalarWhereWithAggregatesInput[]
    OR?: ProductScalarWhereWithAggregatesInput[]
    NOT?: ProductScalarWhereWithAggregatesInput | ProductScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Product"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Product"> | Date | string
    name?: StringWithAggregatesFilter<"Product"> | string
    description?: StringNullableWithAggregatesFilter<"Product"> | string | null
    price?: IntNullableWithAggregatesFilter<"Product"> | number | null
    comparedAtPrice?: IntNullableWithAggregatesFilter<"Product"> | number | null
    categoryId?: StringNullableWithAggregatesFilter<"Product"> | string | null
  }

  export type CategoryWhereInput = {
    AND?: CategoryWhereInput | CategoryWhereInput[]
    OR?: CategoryWhereInput[]
    NOT?: CategoryWhereInput | CategoryWhereInput[]
    id?: StringFilter<"Category"> | string
    createdAt?: DateTimeFilter<"Category"> | Date | string
    name?: StringFilter<"Category"> | string
    products?: ProductListRelationFilter
  }

  export type CategoryOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    products?: ProductOrderByRelationAggregateInput
  }

  export type CategoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CategoryWhereInput | CategoryWhereInput[]
    OR?: CategoryWhereInput[]
    NOT?: CategoryWhereInput | CategoryWhereInput[]
    createdAt?: DateTimeFilter<"Category"> | Date | string
    name?: StringFilter<"Category"> | string
    products?: ProductListRelationFilter
  }, "id">

  export type CategoryOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    _count?: CategoryCountOrderByAggregateInput
    _max?: CategoryMaxOrderByAggregateInput
    _min?: CategoryMinOrderByAggregateInput
  }

  export type CategoryScalarWhereWithAggregatesInput = {
    AND?: CategoryScalarWhereWithAggregatesInput | CategoryScalarWhereWithAggregatesInput[]
    OR?: CategoryScalarWhereWithAggregatesInput[]
    NOT?: CategoryScalarWhereWithAggregatesInput | CategoryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Category"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Category"> | Date | string
    name?: StringWithAggregatesFilter<"Category"> | string
  }

  export type CampaignWhereInput = {
    AND?: CampaignWhereInput | CampaignWhereInput[]
    OR?: CampaignWhereInput[]
    NOT?: CampaignWhereInput | CampaignWhereInput[]
    id?: StringFilter<"Campaign"> | string
    createdAt?: DateTimeFilter<"Campaign"> | Date | string
    startedAt?: DateTimeNullableFilter<"Campaign"> | Date | string | null
    promotialMessages?: PromotialMessageListRelationFilter
  }

  export type CampaignOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    startedAt?: SortOrderInput | SortOrder
    promotialMessages?: PromotialMessageOrderByRelationAggregateInput
  }

  export type CampaignWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CampaignWhereInput | CampaignWhereInput[]
    OR?: CampaignWhereInput[]
    NOT?: CampaignWhereInput | CampaignWhereInput[]
    createdAt?: DateTimeFilter<"Campaign"> | Date | string
    startedAt?: DateTimeNullableFilter<"Campaign"> | Date | string | null
    promotialMessages?: PromotialMessageListRelationFilter
  }, "id">

  export type CampaignOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    startedAt?: SortOrderInput | SortOrder
    _count?: CampaignCountOrderByAggregateInput
    _max?: CampaignMaxOrderByAggregateInput
    _min?: CampaignMinOrderByAggregateInput
  }

  export type CampaignScalarWhereWithAggregatesInput = {
    AND?: CampaignScalarWhereWithAggregatesInput | CampaignScalarWhereWithAggregatesInput[]
    OR?: CampaignScalarWhereWithAggregatesInput[]
    NOT?: CampaignScalarWhereWithAggregatesInput | CampaignScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Campaign"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Campaign"> | Date | string
    startedAt?: DateTimeNullableWithAggregatesFilter<"Campaign"> | Date | string | null
  }

  export type CustomerWhereInput = {
    AND?: CustomerWhereInput | CustomerWhereInput[]
    OR?: CustomerWhereInput[]
    NOT?: CustomerWhereInput | CustomerWhereInput[]
    id?: StringFilter<"Customer"> | string
    createdAt?: DateTimeFilter<"Customer"> | Date | string
    name?: StringNullableFilter<"Customer"> | string | null
    email?: StringNullableFilter<"Customer"> | string | null
    phone?: StringNullableFilter<"Customer"> | string | null
    address?: StringNullableFilter<"Customer"> | string | null
    lastMessageSent?: DateTimeNullableFilter<"Customer"> | Date | string | null
    orders?: OrderListRelationFilter
    promotionalMessages?: PromotialMessageListRelationFilter
    addresses?: DeliveryAddressListRelationFilter
  }

  export type CustomerOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    address?: SortOrderInput | SortOrder
    lastMessageSent?: SortOrderInput | SortOrder
    orders?: OrderOrderByRelationAggregateInput
    promotionalMessages?: PromotialMessageOrderByRelationAggregateInput
    addresses?: DeliveryAddressOrderByRelationAggregateInput
  }

  export type CustomerWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CustomerWhereInput | CustomerWhereInput[]
    OR?: CustomerWhereInput[]
    NOT?: CustomerWhereInput | CustomerWhereInput[]
    createdAt?: DateTimeFilter<"Customer"> | Date | string
    name?: StringNullableFilter<"Customer"> | string | null
    email?: StringNullableFilter<"Customer"> | string | null
    phone?: StringNullableFilter<"Customer"> | string | null
    address?: StringNullableFilter<"Customer"> | string | null
    lastMessageSent?: DateTimeNullableFilter<"Customer"> | Date | string | null
    orders?: OrderListRelationFilter
    promotionalMessages?: PromotialMessageListRelationFilter
    addresses?: DeliveryAddressListRelationFilter
  }, "id">

  export type CustomerOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    address?: SortOrderInput | SortOrder
    lastMessageSent?: SortOrderInput | SortOrder
    _count?: CustomerCountOrderByAggregateInput
    _max?: CustomerMaxOrderByAggregateInput
    _min?: CustomerMinOrderByAggregateInput
  }

  export type CustomerScalarWhereWithAggregatesInput = {
    AND?: CustomerScalarWhereWithAggregatesInput | CustomerScalarWhereWithAggregatesInput[]
    OR?: CustomerScalarWhereWithAggregatesInput[]
    NOT?: CustomerScalarWhereWithAggregatesInput | CustomerScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Customer"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Customer"> | Date | string
    name?: StringNullableWithAggregatesFilter<"Customer"> | string | null
    email?: StringNullableWithAggregatesFilter<"Customer"> | string | null
    phone?: StringNullableWithAggregatesFilter<"Customer"> | string | null
    address?: StringNullableWithAggregatesFilter<"Customer"> | string | null
    lastMessageSent?: DateTimeNullableWithAggregatesFilter<"Customer"> | Date | string | null
  }

  export type DeliveryAddressWhereInput = {
    AND?: DeliveryAddressWhereInput | DeliveryAddressWhereInput[]
    OR?: DeliveryAddressWhereInput[]
    NOT?: DeliveryAddressWhereInput | DeliveryAddressWhereInput[]
    id?: StringFilter<"DeliveryAddress"> | string
    createdAt?: DateTimeFilter<"DeliveryAddress"> | Date | string
    lat?: StringFilter<"DeliveryAddress"> | string
    lng?: StringFilter<"DeliveryAddress"> | string
    city?: StringFilter<"DeliveryAddress"> | string
    zipCode?: StringFilter<"DeliveryAddress"> | string
    State?: StringFilter<"DeliveryAddress"> | string
    street?: StringFilter<"DeliveryAddress"> | string
    number?: StringFilter<"DeliveryAddress"> | string
    description?: StringFilter<"DeliveryAddress"> | string
    complement?: StringNullableFilter<"DeliveryAddress"> | string | null
    numberComplement?: StringNullableFilter<"DeliveryAddress"> | string | null
    customerId?: StringNullableFilter<"DeliveryAddress"> | string | null
    customer?: XOR<CustomerNullableScalarRelationFilter, CustomerWhereInput> | null
  }

  export type DeliveryAddressOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    lat?: SortOrder
    lng?: SortOrder
    city?: SortOrder
    zipCode?: SortOrder
    State?: SortOrder
    street?: SortOrder
    number?: SortOrder
    description?: SortOrder
    complement?: SortOrderInput | SortOrder
    numberComplement?: SortOrderInput | SortOrder
    customerId?: SortOrderInput | SortOrder
    customer?: CustomerOrderByWithRelationInput
  }

  export type DeliveryAddressWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: DeliveryAddressWhereInput | DeliveryAddressWhereInput[]
    OR?: DeliveryAddressWhereInput[]
    NOT?: DeliveryAddressWhereInput | DeliveryAddressWhereInput[]
    createdAt?: DateTimeFilter<"DeliveryAddress"> | Date | string
    lat?: StringFilter<"DeliveryAddress"> | string
    lng?: StringFilter<"DeliveryAddress"> | string
    city?: StringFilter<"DeliveryAddress"> | string
    zipCode?: StringFilter<"DeliveryAddress"> | string
    State?: StringFilter<"DeliveryAddress"> | string
    street?: StringFilter<"DeliveryAddress"> | string
    number?: StringFilter<"DeliveryAddress"> | string
    description?: StringFilter<"DeliveryAddress"> | string
    complement?: StringNullableFilter<"DeliveryAddress"> | string | null
    numberComplement?: StringNullableFilter<"DeliveryAddress"> | string | null
    customerId?: StringNullableFilter<"DeliveryAddress"> | string | null
    customer?: XOR<CustomerNullableScalarRelationFilter, CustomerWhereInput> | null
  }, "id">

  export type DeliveryAddressOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    lat?: SortOrder
    lng?: SortOrder
    city?: SortOrder
    zipCode?: SortOrder
    State?: SortOrder
    street?: SortOrder
    number?: SortOrder
    description?: SortOrder
    complement?: SortOrderInput | SortOrder
    numberComplement?: SortOrderInput | SortOrder
    customerId?: SortOrderInput | SortOrder
    _count?: DeliveryAddressCountOrderByAggregateInput
    _max?: DeliveryAddressMaxOrderByAggregateInput
    _min?: DeliveryAddressMinOrderByAggregateInput
  }

  export type DeliveryAddressScalarWhereWithAggregatesInput = {
    AND?: DeliveryAddressScalarWhereWithAggregatesInput | DeliveryAddressScalarWhereWithAggregatesInput[]
    OR?: DeliveryAddressScalarWhereWithAggregatesInput[]
    NOT?: DeliveryAddressScalarWhereWithAggregatesInput | DeliveryAddressScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"DeliveryAddress"> | string
    createdAt?: DateTimeWithAggregatesFilter<"DeliveryAddress"> | Date | string
    lat?: StringWithAggregatesFilter<"DeliveryAddress"> | string
    lng?: StringWithAggregatesFilter<"DeliveryAddress"> | string
    city?: StringWithAggregatesFilter<"DeliveryAddress"> | string
    zipCode?: StringWithAggregatesFilter<"DeliveryAddress"> | string
    State?: StringWithAggregatesFilter<"DeliveryAddress"> | string
    street?: StringWithAggregatesFilter<"DeliveryAddress"> | string
    number?: StringWithAggregatesFilter<"DeliveryAddress"> | string
    description?: StringWithAggregatesFilter<"DeliveryAddress"> | string
    complement?: StringNullableWithAggregatesFilter<"DeliveryAddress"> | string | null
    numberComplement?: StringNullableWithAggregatesFilter<"DeliveryAddress"> | string | null
    customerId?: StringNullableWithAggregatesFilter<"DeliveryAddress"> | string | null
  }

  export type MessageWhereInput = {
    AND?: MessageWhereInput | MessageWhereInput[]
    OR?: MessageWhereInput[]
    NOT?: MessageWhereInput | MessageWhereInput[]
    id?: StringFilter<"Message"> | string
    createdAt?: DateTimeFilter<"Message"> | Date | string
    name?: StringFilter<"Message"> | string
    content?: StringFilter<"Message"> | string
    media?: StringNullableFilter<"Message"> | string | null
    promotialMessages?: PromotialMessageListRelationFilter
  }

  export type MessageOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    content?: SortOrder
    media?: SortOrderInput | SortOrder
    promotialMessages?: PromotialMessageOrderByRelationAggregateInput
  }

  export type MessageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    name?: string
    AND?: MessageWhereInput | MessageWhereInput[]
    OR?: MessageWhereInput[]
    NOT?: MessageWhereInput | MessageWhereInput[]
    createdAt?: DateTimeFilter<"Message"> | Date | string
    content?: StringFilter<"Message"> | string
    media?: StringNullableFilter<"Message"> | string | null
    promotialMessages?: PromotialMessageListRelationFilter
  }, "id" | "name">

  export type MessageOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    content?: SortOrder
    media?: SortOrderInput | SortOrder
    _count?: MessageCountOrderByAggregateInput
    _max?: MessageMaxOrderByAggregateInput
    _min?: MessageMinOrderByAggregateInput
  }

  export type MessageScalarWhereWithAggregatesInput = {
    AND?: MessageScalarWhereWithAggregatesInput | MessageScalarWhereWithAggregatesInput[]
    OR?: MessageScalarWhereWithAggregatesInput[]
    NOT?: MessageScalarWhereWithAggregatesInput | MessageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Message"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Message"> | Date | string
    name?: StringWithAggregatesFilter<"Message"> | string
    content?: StringWithAggregatesFilter<"Message"> | string
    media?: StringNullableWithAggregatesFilter<"Message"> | string | null
  }

  export type PromotialMessageWhereInput = {
    AND?: PromotialMessageWhereInput | PromotialMessageWhereInput[]
    OR?: PromotialMessageWhereInput[]
    NOT?: PromotialMessageWhereInput | PromotialMessageWhereInput[]
    id?: StringFilter<"PromotialMessage"> | string
    sentAt?: DateTimeFilter<"PromotialMessage"> | Date | string
    campaignId?: StringNullableFilter<"PromotialMessage"> | string | null
    messageId?: StringFilter<"PromotialMessage"> | string
    customerId?: StringFilter<"PromotialMessage"> | string
    Campaign?: XOR<CampaignNullableScalarRelationFilter, CampaignWhereInput> | null
    message?: XOR<MessageScalarRelationFilter, MessageWhereInput>
    Customer?: XOR<CustomerScalarRelationFilter, CustomerWhereInput>
  }

  export type PromotialMessageOrderByWithRelationInput = {
    id?: SortOrder
    sentAt?: SortOrder
    campaignId?: SortOrderInput | SortOrder
    messageId?: SortOrder
    customerId?: SortOrder
    Campaign?: CampaignOrderByWithRelationInput
    message?: MessageOrderByWithRelationInput
    Customer?: CustomerOrderByWithRelationInput
  }

  export type PromotialMessageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PromotialMessageWhereInput | PromotialMessageWhereInput[]
    OR?: PromotialMessageWhereInput[]
    NOT?: PromotialMessageWhereInput | PromotialMessageWhereInput[]
    sentAt?: DateTimeFilter<"PromotialMessage"> | Date | string
    campaignId?: StringNullableFilter<"PromotialMessage"> | string | null
    messageId?: StringFilter<"PromotialMessage"> | string
    customerId?: StringFilter<"PromotialMessage"> | string
    Campaign?: XOR<CampaignNullableScalarRelationFilter, CampaignWhereInput> | null
    message?: XOR<MessageScalarRelationFilter, MessageWhereInput>
    Customer?: XOR<CustomerScalarRelationFilter, CustomerWhereInput>
  }, "id">

  export type PromotialMessageOrderByWithAggregationInput = {
    id?: SortOrder
    sentAt?: SortOrder
    campaignId?: SortOrderInput | SortOrder
    messageId?: SortOrder
    customerId?: SortOrder
    _count?: PromotialMessageCountOrderByAggregateInput
    _max?: PromotialMessageMaxOrderByAggregateInput
    _min?: PromotialMessageMinOrderByAggregateInput
  }

  export type PromotialMessageScalarWhereWithAggregatesInput = {
    AND?: PromotialMessageScalarWhereWithAggregatesInput | PromotialMessageScalarWhereWithAggregatesInput[]
    OR?: PromotialMessageScalarWhereWithAggregatesInput[]
    NOT?: PromotialMessageScalarWhereWithAggregatesInput | PromotialMessageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PromotialMessage"> | string
    sentAt?: DateTimeWithAggregatesFilter<"PromotialMessage"> | Date | string
    campaignId?: StringNullableWithAggregatesFilter<"PromotialMessage"> | string | null
    messageId?: StringWithAggregatesFilter<"PromotialMessage"> | string
    customerId?: StringWithAggregatesFilter<"PromotialMessage"> | string
  }

  export type OrderWhereInput = {
    AND?: OrderWhereInput | OrderWhereInput[]
    OR?: OrderWhereInput[]
    NOT?: OrderWhereInput | OrderWhereInput[]
    id?: StringFilter<"Order"> | string
    createdAt?: DateTimeFilter<"Order"> | Date | string
    amount?: IntFilter<"Order"> | number
    type?: EnumOrderTypeFilter<"Order"> | $Enums.OrderType
    paymentMethod?: EnumPaymentTypeFilter<"Order"> | $Enums.PaymentType
    tipAmount?: IntNullableFilter<"Order"> | number | null
    customerId?: StringFilter<"Order"> | string
    externalId?: StringNullableFilter<"Order"> | string | null
    addressId?: StringNullableFilter<"Order"> | string | null
    customer?: XOR<CustomerScalarRelationFilter, CustomerWhereInput>
    address?: XOR<AddressNullableScalarRelationFilter, AddressWhereInput> | null
    orderProducts?: OrderProductsListRelationFilter
  }

  export type OrderOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    amount?: SortOrder
    type?: SortOrder
    paymentMethod?: SortOrder
    tipAmount?: SortOrderInput | SortOrder
    customerId?: SortOrder
    externalId?: SortOrderInput | SortOrder
    addressId?: SortOrderInput | SortOrder
    customer?: CustomerOrderByWithRelationInput
    address?: AddressOrderByWithRelationInput
    orderProducts?: OrderProductsOrderByRelationAggregateInput
  }

  export type OrderWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: OrderWhereInput | OrderWhereInput[]
    OR?: OrderWhereInput[]
    NOT?: OrderWhereInput | OrderWhereInput[]
    createdAt?: DateTimeFilter<"Order"> | Date | string
    amount?: IntFilter<"Order"> | number
    type?: EnumOrderTypeFilter<"Order"> | $Enums.OrderType
    paymentMethod?: EnumPaymentTypeFilter<"Order"> | $Enums.PaymentType
    tipAmount?: IntNullableFilter<"Order"> | number | null
    customerId?: StringFilter<"Order"> | string
    externalId?: StringNullableFilter<"Order"> | string | null
    addressId?: StringNullableFilter<"Order"> | string | null
    customer?: XOR<CustomerScalarRelationFilter, CustomerWhereInput>
    address?: XOR<AddressNullableScalarRelationFilter, AddressWhereInput> | null
    orderProducts?: OrderProductsListRelationFilter
  }, "id">

  export type OrderOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    amount?: SortOrder
    type?: SortOrder
    paymentMethod?: SortOrder
    tipAmount?: SortOrderInput | SortOrder
    customerId?: SortOrder
    externalId?: SortOrderInput | SortOrder
    addressId?: SortOrderInput | SortOrder
    _count?: OrderCountOrderByAggregateInput
    _avg?: OrderAvgOrderByAggregateInput
    _max?: OrderMaxOrderByAggregateInput
    _min?: OrderMinOrderByAggregateInput
    _sum?: OrderSumOrderByAggregateInput
  }

  export type OrderScalarWhereWithAggregatesInput = {
    AND?: OrderScalarWhereWithAggregatesInput | OrderScalarWhereWithAggregatesInput[]
    OR?: OrderScalarWhereWithAggregatesInput[]
    NOT?: OrderScalarWhereWithAggregatesInput | OrderScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Order"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Order"> | Date | string
    amount?: IntWithAggregatesFilter<"Order"> | number
    type?: EnumOrderTypeWithAggregatesFilter<"Order"> | $Enums.OrderType
    paymentMethod?: EnumPaymentTypeWithAggregatesFilter<"Order"> | $Enums.PaymentType
    tipAmount?: IntNullableWithAggregatesFilter<"Order"> | number | null
    customerId?: StringWithAggregatesFilter<"Order"> | string
    externalId?: StringNullableWithAggregatesFilter<"Order"> | string | null
    addressId?: StringNullableWithAggregatesFilter<"Order"> | string | null
  }

  export type OrderProductsWhereInput = {
    AND?: OrderProductsWhereInput | OrderProductsWhereInput[]
    OR?: OrderProductsWhereInput[]
    NOT?: OrderProductsWhereInput | OrderProductsWhereInput[]
    id?: StringFilter<"OrderProducts"> | string
    createdAt?: DateTimeFilter<"OrderProducts"> | Date | string
    productId?: StringFilter<"OrderProducts"> | string
    quantity?: IntFilter<"OrderProducts"> | number
    fullAmount?: IntFilter<"OrderProducts"> | number
    amount?: IntFilter<"OrderProducts"> | number
    orderId?: StringNullableFilter<"OrderProducts"> | string | null
    product?: XOR<ProductScalarRelationFilter, ProductWhereInput>
    order?: XOR<OrderNullableScalarRelationFilter, OrderWhereInput> | null
  }

  export type OrderProductsOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    productId?: SortOrder
    quantity?: SortOrder
    fullAmount?: SortOrder
    amount?: SortOrder
    orderId?: SortOrderInput | SortOrder
    product?: ProductOrderByWithRelationInput
    order?: OrderOrderByWithRelationInput
  }

  export type OrderProductsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: OrderProductsWhereInput | OrderProductsWhereInput[]
    OR?: OrderProductsWhereInput[]
    NOT?: OrderProductsWhereInput | OrderProductsWhereInput[]
    createdAt?: DateTimeFilter<"OrderProducts"> | Date | string
    productId?: StringFilter<"OrderProducts"> | string
    quantity?: IntFilter<"OrderProducts"> | number
    fullAmount?: IntFilter<"OrderProducts"> | number
    amount?: IntFilter<"OrderProducts"> | number
    orderId?: StringNullableFilter<"OrderProducts"> | string | null
    product?: XOR<ProductScalarRelationFilter, ProductWhereInput>
    order?: XOR<OrderNullableScalarRelationFilter, OrderWhereInput> | null
  }, "id">

  export type OrderProductsOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    productId?: SortOrder
    quantity?: SortOrder
    fullAmount?: SortOrder
    amount?: SortOrder
    orderId?: SortOrderInput | SortOrder
    _count?: OrderProductsCountOrderByAggregateInput
    _avg?: OrderProductsAvgOrderByAggregateInput
    _max?: OrderProductsMaxOrderByAggregateInput
    _min?: OrderProductsMinOrderByAggregateInput
    _sum?: OrderProductsSumOrderByAggregateInput
  }

  export type OrderProductsScalarWhereWithAggregatesInput = {
    AND?: OrderProductsScalarWhereWithAggregatesInput | OrderProductsScalarWhereWithAggregatesInput[]
    OR?: OrderProductsScalarWhereWithAggregatesInput[]
    NOT?: OrderProductsScalarWhereWithAggregatesInput | OrderProductsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"OrderProducts"> | string
    createdAt?: DateTimeWithAggregatesFilter<"OrderProducts"> | Date | string
    productId?: StringWithAggregatesFilter<"OrderProducts"> | string
    quantity?: IntWithAggregatesFilter<"OrderProducts"> | number
    fullAmount?: IntWithAggregatesFilter<"OrderProducts"> | number
    amount?: IntWithAggregatesFilter<"OrderProducts"> | number
    orderId?: StringNullableWithAggregatesFilter<"OrderProducts"> | string | null
  }

  export type ProgressiveDiscountCreateInput = {
    id: string
    createdAt?: Date | string
    steps?: ProgressiveDiscountStepCreateNestedManyWithoutProgressiveDiscountInput
  }

  export type ProgressiveDiscountUncheckedCreateInput = {
    id: string
    createdAt?: Date | string
    steps?: ProgressiveDiscountStepUncheckedCreateNestedManyWithoutProgressiveDiscountInput
  }

  export type ProgressiveDiscountUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    steps?: ProgressiveDiscountStepUpdateManyWithoutProgressiveDiscountNestedInput
  }

  export type ProgressiveDiscountUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    steps?: ProgressiveDiscountStepUncheckedUpdateManyWithoutProgressiveDiscountNestedInput
  }

  export type ProgressiveDiscountCreateManyInput = {
    id: string
    createdAt?: Date | string
  }

  export type ProgressiveDiscountUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProgressiveDiscountUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProgressiveDiscountStepCreateInput = {
    id: string
    createdAt?: Date | string
    amount: number
    discount?: number | null
    discountType: $Enums.ProgressiveDiscountStepType
    progressiveDiscount: ProgressiveDiscountCreateNestedOneWithoutStepsInput
  }

  export type ProgressiveDiscountStepUncheckedCreateInput = {
    id: string
    createdAt?: Date | string
    amount: number
    discount?: number | null
    discountType: $Enums.ProgressiveDiscountStepType
    progressiveDiscountId: string
  }

  export type ProgressiveDiscountStepUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    amount?: IntFieldUpdateOperationsInput | number
    discount?: NullableIntFieldUpdateOperationsInput | number | null
    discountType?: EnumProgressiveDiscountStepTypeFieldUpdateOperationsInput | $Enums.ProgressiveDiscountStepType
    progressiveDiscount?: ProgressiveDiscountUpdateOneRequiredWithoutStepsNestedInput
  }

  export type ProgressiveDiscountStepUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    amount?: IntFieldUpdateOperationsInput | number
    discount?: NullableIntFieldUpdateOperationsInput | number | null
    discountType?: EnumProgressiveDiscountStepTypeFieldUpdateOperationsInput | $Enums.ProgressiveDiscountStepType
    progressiveDiscountId?: StringFieldUpdateOperationsInput | string
  }

  export type ProgressiveDiscountStepCreateManyInput = {
    id: string
    createdAt?: Date | string
    amount: number
    discount?: number | null
    discountType: $Enums.ProgressiveDiscountStepType
    progressiveDiscountId: string
  }

  export type ProgressiveDiscountStepUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    amount?: IntFieldUpdateOperationsInput | number
    discount?: NullableIntFieldUpdateOperationsInput | number | null
    discountType?: EnumProgressiveDiscountStepTypeFieldUpdateOperationsInput | $Enums.ProgressiveDiscountStepType
  }

  export type ProgressiveDiscountStepUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    amount?: IntFieldUpdateOperationsInput | number
    discount?: NullableIntFieldUpdateOperationsInput | number | null
    discountType?: EnumProgressiveDiscountStepTypeFieldUpdateOperationsInput | $Enums.ProgressiveDiscountStepType
    progressiveDiscountId?: StringFieldUpdateOperationsInput | string
  }

  export type FileCreateInput = {
    id: string
    createdAt?: Date | string
    name: string
    url: string
    size: number
    product?: ProductCreateNestedOneWithoutPhotosInput
  }

  export type FileUncheckedCreateInput = {
    id: string
    createdAt?: Date | string
    name: string
    url: string
    size: number
    productId?: string | null
  }

  export type FileUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    size?: IntFieldUpdateOperationsInput | number
    product?: ProductUpdateOneWithoutPhotosNestedInput
  }

  export type FileUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    size?: IntFieldUpdateOperationsInput | number
    productId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type FileCreateManyInput = {
    id: string
    createdAt?: Date | string
    name: string
    url: string
    size: number
    productId?: string | null
  }

  export type FileUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    size?: IntFieldUpdateOperationsInput | number
  }

  export type FileUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    size?: IntFieldUpdateOperationsInput | number
    productId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ModifierGroupCreateInput = {
    id: string
    createdAt?: Date | string
    title: string
    required?: boolean
    type?: $Enums.ModifierGroupType | null
    minSelection?: number | null
    maxSelection?: number | null
    product?: ProductCreateNestedOneWithoutModifierGroupsInput
  }

  export type ModifierGroupUncheckedCreateInput = {
    id: string
    createdAt?: Date | string
    title: string
    required?: boolean
    type?: $Enums.ModifierGroupType | null
    productId?: string | null
    minSelection?: number | null
    maxSelection?: number | null
  }

  export type ModifierGroupUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: StringFieldUpdateOperationsInput | string
    required?: BoolFieldUpdateOperationsInput | boolean
    type?: NullableEnumModifierGroupTypeFieldUpdateOperationsInput | $Enums.ModifierGroupType | null
    minSelection?: NullableIntFieldUpdateOperationsInput | number | null
    maxSelection?: NullableIntFieldUpdateOperationsInput | number | null
    product?: ProductUpdateOneWithoutModifierGroupsNestedInput
  }

  export type ModifierGroupUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: StringFieldUpdateOperationsInput | string
    required?: BoolFieldUpdateOperationsInput | boolean
    type?: NullableEnumModifierGroupTypeFieldUpdateOperationsInput | $Enums.ModifierGroupType | null
    productId?: NullableStringFieldUpdateOperationsInput | string | null
    minSelection?: NullableIntFieldUpdateOperationsInput | number | null
    maxSelection?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type ModifierGroupCreateManyInput = {
    id: string
    createdAt?: Date | string
    title: string
    required?: boolean
    type?: $Enums.ModifierGroupType | null
    productId?: string | null
    minSelection?: number | null
    maxSelection?: number | null
  }

  export type ModifierGroupUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: StringFieldUpdateOperationsInput | string
    required?: BoolFieldUpdateOperationsInput | boolean
    type?: NullableEnumModifierGroupTypeFieldUpdateOperationsInput | $Enums.ModifierGroupType | null
    minSelection?: NullableIntFieldUpdateOperationsInput | number | null
    maxSelection?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type ModifierGroupUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: StringFieldUpdateOperationsInput | string
    required?: BoolFieldUpdateOperationsInput | boolean
    type?: NullableEnumModifierGroupTypeFieldUpdateOperationsInput | $Enums.ModifierGroupType | null
    productId?: NullableStringFieldUpdateOperationsInput | string | null
    minSelection?: NullableIntFieldUpdateOperationsInput | number | null
    maxSelection?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type BusinessCreateInput = {
    id: string
    createdAt?: Date | string
    name: string
    branches?: BranchCreateNestedManyWithoutBusinessInput
  }

  export type BusinessUncheckedCreateInput = {
    id: string
    createdAt?: Date | string
    name: string
    branches?: BranchUncheckedCreateNestedManyWithoutBusinessInput
  }

  export type BusinessUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    branches?: BranchUpdateManyWithoutBusinessNestedInput
  }

  export type BusinessUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    branches?: BranchUncheckedUpdateManyWithoutBusinessNestedInput
  }

  export type BusinessCreateManyInput = {
    id: string
    createdAt?: Date | string
    name: string
  }

  export type BusinessUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type BusinessUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type BranchCreateInput = {
    id: string
    createdAt?: Date | string
    name: string
    address?: AddressCreateNestedOneWithoutBranchInput
    business?: BusinessCreateNestedOneWithoutBranchesInput
  }

  export type BranchUncheckedCreateInput = {
    id: string
    createdAt?: Date | string
    name: string
    addressId?: string | null
    businessId?: string | null
  }

  export type BranchUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    address?: AddressUpdateOneWithoutBranchNestedInput
    business?: BusinessUpdateOneWithoutBranchesNestedInput
  }

  export type BranchUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    addressId?: NullableStringFieldUpdateOperationsInput | string | null
    businessId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type BranchCreateManyInput = {
    id: string
    createdAt?: Date | string
    name: string
    addressId?: string | null
    businessId?: string | null
  }

  export type BranchUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type BranchUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    addressId?: NullableStringFieldUpdateOperationsInput | string | null
    businessId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AddressCreateInput = {
    id: string
    createdAt?: Date | string
    description: string
    googleMapsUrl: string
    branch?: BranchCreateNestedOneWithoutAddressInput
    orders?: OrderCreateNestedManyWithoutAddressInput
  }

  export type AddressUncheckedCreateInput = {
    id: string
    createdAt?: Date | string
    description: string
    googleMapsUrl: string
    branch?: BranchUncheckedCreateNestedOneWithoutAddressInput
    orders?: OrderUncheckedCreateNestedManyWithoutAddressInput
  }

  export type AddressUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    description?: StringFieldUpdateOperationsInput | string
    googleMapsUrl?: StringFieldUpdateOperationsInput | string
    branch?: BranchUpdateOneWithoutAddressNestedInput
    orders?: OrderUpdateManyWithoutAddressNestedInput
  }

  export type AddressUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    description?: StringFieldUpdateOperationsInput | string
    googleMapsUrl?: StringFieldUpdateOperationsInput | string
    branch?: BranchUncheckedUpdateOneWithoutAddressNestedInput
    orders?: OrderUncheckedUpdateManyWithoutAddressNestedInput
  }

  export type AddressCreateManyInput = {
    id: string
    createdAt?: Date | string
    description: string
    googleMapsUrl: string
  }

  export type AddressUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    description?: StringFieldUpdateOperationsInput | string
    googleMapsUrl?: StringFieldUpdateOperationsInput | string
  }

  export type AddressUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    description?: StringFieldUpdateOperationsInput | string
    googleMapsUrl?: StringFieldUpdateOperationsInput | string
  }

  export type ProductCreateInput = {
    id: string
    createdAt?: Date | string
    name: string
    description?: string | null
    price?: number | null
    comparedAtPrice?: number | null
    photos?: FileCreateNestedManyWithoutProductInput
    modifierGroups?: ModifierGroupCreateNestedManyWithoutProductInput
    category?: CategoryCreateNestedOneWithoutProductsInput
    OrderProducts?: OrderProductsCreateNestedManyWithoutProductInput
  }

  export type ProductUncheckedCreateInput = {
    id: string
    createdAt?: Date | string
    name: string
    description?: string | null
    price?: number | null
    comparedAtPrice?: number | null
    categoryId?: string | null
    photos?: FileUncheckedCreateNestedManyWithoutProductInput
    modifierGroups?: ModifierGroupUncheckedCreateNestedManyWithoutProductInput
    OrderProducts?: OrderProductsUncheckedCreateNestedManyWithoutProductInput
  }

  export type ProductUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    price?: NullableIntFieldUpdateOperationsInput | number | null
    comparedAtPrice?: NullableIntFieldUpdateOperationsInput | number | null
    photos?: FileUpdateManyWithoutProductNestedInput
    modifierGroups?: ModifierGroupUpdateManyWithoutProductNestedInput
    category?: CategoryUpdateOneWithoutProductsNestedInput
    OrderProducts?: OrderProductsUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    price?: NullableIntFieldUpdateOperationsInput | number | null
    comparedAtPrice?: NullableIntFieldUpdateOperationsInput | number | null
    categoryId?: NullableStringFieldUpdateOperationsInput | string | null
    photos?: FileUncheckedUpdateManyWithoutProductNestedInput
    modifierGroups?: ModifierGroupUncheckedUpdateManyWithoutProductNestedInput
    OrderProducts?: OrderProductsUncheckedUpdateManyWithoutProductNestedInput
  }

  export type ProductCreateManyInput = {
    id: string
    createdAt?: Date | string
    name: string
    description?: string | null
    price?: number | null
    comparedAtPrice?: number | null
    categoryId?: string | null
  }

  export type ProductUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    price?: NullableIntFieldUpdateOperationsInput | number | null
    comparedAtPrice?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type ProductUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    price?: NullableIntFieldUpdateOperationsInput | number | null
    comparedAtPrice?: NullableIntFieldUpdateOperationsInput | number | null
    categoryId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type CategoryCreateInput = {
    id: string
    createdAt?: Date | string
    name: string
    products?: ProductCreateNestedManyWithoutCategoryInput
  }

  export type CategoryUncheckedCreateInput = {
    id: string
    createdAt?: Date | string
    name: string
    products?: ProductUncheckedCreateNestedManyWithoutCategoryInput
  }

  export type CategoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    products?: ProductUpdateManyWithoutCategoryNestedInput
  }

  export type CategoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    products?: ProductUncheckedUpdateManyWithoutCategoryNestedInput
  }

  export type CategoryCreateManyInput = {
    id: string
    createdAt?: Date | string
    name: string
  }

  export type CategoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type CategoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type CampaignCreateInput = {
    id: string
    createdAt?: Date | string
    startedAt?: Date | string | null
    promotialMessages?: PromotialMessageCreateNestedManyWithoutCampaignInput
  }

  export type CampaignUncheckedCreateInput = {
    id: string
    createdAt?: Date | string
    startedAt?: Date | string | null
    promotialMessages?: PromotialMessageUncheckedCreateNestedManyWithoutCampaignInput
  }

  export type CampaignUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    promotialMessages?: PromotialMessageUpdateManyWithoutCampaignNestedInput
  }

  export type CampaignUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    promotialMessages?: PromotialMessageUncheckedUpdateManyWithoutCampaignNestedInput
  }

  export type CampaignCreateManyInput = {
    id: string
    createdAt?: Date | string
    startedAt?: Date | string | null
  }

  export type CampaignUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type CampaignUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type CustomerCreateInput = {
    id: string
    createdAt?: Date | string
    name?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    lastMessageSent?: Date | string | null
    orders?: OrderCreateNestedManyWithoutCustomerInput
    promotionalMessages?: PromotialMessageCreateNestedManyWithoutCustomerInput
    addresses?: DeliveryAddressCreateNestedManyWithoutCustomerInput
  }

  export type CustomerUncheckedCreateInput = {
    id: string
    createdAt?: Date | string
    name?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    lastMessageSent?: Date | string | null
    orders?: OrderUncheckedCreateNestedManyWithoutCustomerInput
    promotionalMessages?: PromotialMessageUncheckedCreateNestedManyWithoutCustomerInput
    addresses?: DeliveryAddressUncheckedCreateNestedManyWithoutCustomerInput
  }

  export type CustomerUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    lastMessageSent?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    orders?: OrderUpdateManyWithoutCustomerNestedInput
    promotionalMessages?: PromotialMessageUpdateManyWithoutCustomerNestedInput
    addresses?: DeliveryAddressUpdateManyWithoutCustomerNestedInput
  }

  export type CustomerUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    lastMessageSent?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    orders?: OrderUncheckedUpdateManyWithoutCustomerNestedInput
    promotionalMessages?: PromotialMessageUncheckedUpdateManyWithoutCustomerNestedInput
    addresses?: DeliveryAddressUncheckedUpdateManyWithoutCustomerNestedInput
  }

  export type CustomerCreateManyInput = {
    id: string
    createdAt?: Date | string
    name?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    lastMessageSent?: Date | string | null
  }

  export type CustomerUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    lastMessageSent?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type CustomerUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    lastMessageSent?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type DeliveryAddressCreateInput = {
    id: string
    createdAt?: Date | string
    lat: string
    lng: string
    city: string
    zipCode: string
    State: string
    street: string
    number: string
    description: string
    complement?: string | null
    numberComplement?: string | null
    customer?: CustomerCreateNestedOneWithoutAddressesInput
  }

  export type DeliveryAddressUncheckedCreateInput = {
    id: string
    createdAt?: Date | string
    lat: string
    lng: string
    city: string
    zipCode: string
    State: string
    street: string
    number: string
    description: string
    complement?: string | null
    numberComplement?: string | null
    customerId?: string | null
  }

  export type DeliveryAddressUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lat?: StringFieldUpdateOperationsInput | string
    lng?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    zipCode?: StringFieldUpdateOperationsInput | string
    State?: StringFieldUpdateOperationsInput | string
    street?: StringFieldUpdateOperationsInput | string
    number?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    complement?: NullableStringFieldUpdateOperationsInput | string | null
    numberComplement?: NullableStringFieldUpdateOperationsInput | string | null
    customer?: CustomerUpdateOneWithoutAddressesNestedInput
  }

  export type DeliveryAddressUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lat?: StringFieldUpdateOperationsInput | string
    lng?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    zipCode?: StringFieldUpdateOperationsInput | string
    State?: StringFieldUpdateOperationsInput | string
    street?: StringFieldUpdateOperationsInput | string
    number?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    complement?: NullableStringFieldUpdateOperationsInput | string | null
    numberComplement?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type DeliveryAddressCreateManyInput = {
    id: string
    createdAt?: Date | string
    lat: string
    lng: string
    city: string
    zipCode: string
    State: string
    street: string
    number: string
    description: string
    complement?: string | null
    numberComplement?: string | null
    customerId?: string | null
  }

  export type DeliveryAddressUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lat?: StringFieldUpdateOperationsInput | string
    lng?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    zipCode?: StringFieldUpdateOperationsInput | string
    State?: StringFieldUpdateOperationsInput | string
    street?: StringFieldUpdateOperationsInput | string
    number?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    complement?: NullableStringFieldUpdateOperationsInput | string | null
    numberComplement?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type DeliveryAddressUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lat?: StringFieldUpdateOperationsInput | string
    lng?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    zipCode?: StringFieldUpdateOperationsInput | string
    State?: StringFieldUpdateOperationsInput | string
    street?: StringFieldUpdateOperationsInput | string
    number?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    complement?: NullableStringFieldUpdateOperationsInput | string | null
    numberComplement?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type MessageCreateInput = {
    id: string
    createdAt?: Date | string
    name: string
    content: string
    media?: string | null
    promotialMessages?: PromotialMessageCreateNestedManyWithoutMessageInput
  }

  export type MessageUncheckedCreateInput = {
    id: string
    createdAt?: Date | string
    name: string
    content: string
    media?: string | null
    promotialMessages?: PromotialMessageUncheckedCreateNestedManyWithoutMessageInput
  }

  export type MessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    media?: NullableStringFieldUpdateOperationsInput | string | null
    promotialMessages?: PromotialMessageUpdateManyWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    media?: NullableStringFieldUpdateOperationsInput | string | null
    promotialMessages?: PromotialMessageUncheckedUpdateManyWithoutMessageNestedInput
  }

  export type MessageCreateManyInput = {
    id: string
    createdAt?: Date | string
    name: string
    content: string
    media?: string | null
  }

  export type MessageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    media?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type MessageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    media?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PromotialMessageCreateInput = {
    id: string
    sentAt?: Date | string
    Campaign?: CampaignCreateNestedOneWithoutPromotialMessagesInput
    message: MessageCreateNestedOneWithoutPromotialMessagesInput
    Customer: CustomerCreateNestedOneWithoutPromotionalMessagesInput
  }

  export type PromotialMessageUncheckedCreateInput = {
    id: string
    sentAt?: Date | string
    campaignId?: string | null
    messageId: string
    customerId: string
  }

  export type PromotialMessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
    Campaign?: CampaignUpdateOneWithoutPromotialMessagesNestedInput
    message?: MessageUpdateOneRequiredWithoutPromotialMessagesNestedInput
    Customer?: CustomerUpdateOneRequiredWithoutPromotionalMessagesNestedInput
  }

  export type PromotialMessageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
    campaignId?: NullableStringFieldUpdateOperationsInput | string | null
    messageId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
  }

  export type PromotialMessageCreateManyInput = {
    id: string
    sentAt?: Date | string
    campaignId?: string | null
    messageId: string
    customerId: string
  }

  export type PromotialMessageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PromotialMessageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
    campaignId?: NullableStringFieldUpdateOperationsInput | string | null
    messageId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
  }

  export type OrderCreateInput = {
    id: string
    createdAt?: Date | string
    amount: number
    type?: $Enums.OrderType
    paymentMethod?: $Enums.PaymentType
    tipAmount?: number | null
    externalId?: string | null
    customer: CustomerCreateNestedOneWithoutOrdersInput
    address?: AddressCreateNestedOneWithoutOrdersInput
    orderProducts?: OrderProductsCreateNestedManyWithoutOrderInput
  }

  export type OrderUncheckedCreateInput = {
    id: string
    createdAt?: Date | string
    amount: number
    type?: $Enums.OrderType
    paymentMethod?: $Enums.PaymentType
    tipAmount?: number | null
    customerId: string
    externalId?: string | null
    addressId?: string | null
    orderProducts?: OrderProductsUncheckedCreateNestedManyWithoutOrderInput
  }

  export type OrderUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    amount?: IntFieldUpdateOperationsInput | number
    type?: EnumOrderTypeFieldUpdateOperationsInput | $Enums.OrderType
    paymentMethod?: EnumPaymentTypeFieldUpdateOperationsInput | $Enums.PaymentType
    tipAmount?: NullableIntFieldUpdateOperationsInput | number | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    customer?: CustomerUpdateOneRequiredWithoutOrdersNestedInput
    address?: AddressUpdateOneWithoutOrdersNestedInput
    orderProducts?: OrderProductsUpdateManyWithoutOrderNestedInput
  }

  export type OrderUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    amount?: IntFieldUpdateOperationsInput | number
    type?: EnumOrderTypeFieldUpdateOperationsInput | $Enums.OrderType
    paymentMethod?: EnumPaymentTypeFieldUpdateOperationsInput | $Enums.PaymentType
    tipAmount?: NullableIntFieldUpdateOperationsInput | number | null
    customerId?: StringFieldUpdateOperationsInput | string
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    addressId?: NullableStringFieldUpdateOperationsInput | string | null
    orderProducts?: OrderProductsUncheckedUpdateManyWithoutOrderNestedInput
  }

  export type OrderCreateManyInput = {
    id: string
    createdAt?: Date | string
    amount: number
    type?: $Enums.OrderType
    paymentMethod?: $Enums.PaymentType
    tipAmount?: number | null
    customerId: string
    externalId?: string | null
    addressId?: string | null
  }

  export type OrderUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    amount?: IntFieldUpdateOperationsInput | number
    type?: EnumOrderTypeFieldUpdateOperationsInput | $Enums.OrderType
    paymentMethod?: EnumPaymentTypeFieldUpdateOperationsInput | $Enums.PaymentType
    tipAmount?: NullableIntFieldUpdateOperationsInput | number | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type OrderUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    amount?: IntFieldUpdateOperationsInput | number
    type?: EnumOrderTypeFieldUpdateOperationsInput | $Enums.OrderType
    paymentMethod?: EnumPaymentTypeFieldUpdateOperationsInput | $Enums.PaymentType
    tipAmount?: NullableIntFieldUpdateOperationsInput | number | null
    customerId?: StringFieldUpdateOperationsInput | string
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    addressId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type OrderProductsCreateInput = {
    id: string
    createdAt?: Date | string
    quantity: number
    fullAmount: number
    amount: number
    product: ProductCreateNestedOneWithoutOrderProductsInput
    order?: OrderCreateNestedOneWithoutOrderProductsInput
  }

  export type OrderProductsUncheckedCreateInput = {
    id: string
    createdAt?: Date | string
    productId: string
    quantity: number
    fullAmount: number
    amount: number
    orderId?: string | null
  }

  export type OrderProductsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quantity?: IntFieldUpdateOperationsInput | number
    fullAmount?: IntFieldUpdateOperationsInput | number
    amount?: IntFieldUpdateOperationsInput | number
    product?: ProductUpdateOneRequiredWithoutOrderProductsNestedInput
    order?: OrderUpdateOneWithoutOrderProductsNestedInput
  }

  export type OrderProductsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    productId?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    fullAmount?: IntFieldUpdateOperationsInput | number
    amount?: IntFieldUpdateOperationsInput | number
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type OrderProductsCreateManyInput = {
    id: string
    createdAt?: Date | string
    productId: string
    quantity: number
    fullAmount: number
    amount: number
    orderId?: string | null
  }

  export type OrderProductsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quantity?: IntFieldUpdateOperationsInput | number
    fullAmount?: IntFieldUpdateOperationsInput | number
    amount?: IntFieldUpdateOperationsInput | number
  }

  export type OrderProductsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    productId?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    fullAmount?: IntFieldUpdateOperationsInput | number
    amount?: IntFieldUpdateOperationsInput | number
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type ProgressiveDiscountStepListRelationFilter = {
    every?: ProgressiveDiscountStepWhereInput
    some?: ProgressiveDiscountStepWhereInput
    none?: ProgressiveDiscountStepWhereInput
  }

  export type ProgressiveDiscountStepOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ProgressiveDiscountCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
  }

  export type ProgressiveDiscountMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
  }

  export type ProgressiveDiscountMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type EnumProgressiveDiscountStepTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ProgressiveDiscountStepType | EnumProgressiveDiscountStepTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProgressiveDiscountStepType[] | ListEnumProgressiveDiscountStepTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProgressiveDiscountStepType[] | ListEnumProgressiveDiscountStepTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProgressiveDiscountStepTypeFilter<$PrismaModel> | $Enums.ProgressiveDiscountStepType
  }

  export type ProgressiveDiscountScalarRelationFilter = {
    is?: ProgressiveDiscountWhereInput
    isNot?: ProgressiveDiscountWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ProgressiveDiscountStepCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    amount?: SortOrder
    discount?: SortOrder
    discountType?: SortOrder
    progressiveDiscountId?: SortOrder
  }

  export type ProgressiveDiscountStepAvgOrderByAggregateInput = {
    amount?: SortOrder
    discount?: SortOrder
  }

  export type ProgressiveDiscountStepMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    amount?: SortOrder
    discount?: SortOrder
    discountType?: SortOrder
    progressiveDiscountId?: SortOrder
  }

  export type ProgressiveDiscountStepMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    amount?: SortOrder
    discount?: SortOrder
    discountType?: SortOrder
    progressiveDiscountId?: SortOrder
  }

  export type ProgressiveDiscountStepSumOrderByAggregateInput = {
    amount?: SortOrder
    discount?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type EnumProgressiveDiscountStepTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProgressiveDiscountStepType | EnumProgressiveDiscountStepTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProgressiveDiscountStepType[] | ListEnumProgressiveDiscountStepTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProgressiveDiscountStepType[] | ListEnumProgressiveDiscountStepTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProgressiveDiscountStepTypeWithAggregatesFilter<$PrismaModel> | $Enums.ProgressiveDiscountStepType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProgressiveDiscountStepTypeFilter<$PrismaModel>
    _max?: NestedEnumProgressiveDiscountStepTypeFilter<$PrismaModel>
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type ProductNullableScalarRelationFilter = {
    is?: ProductWhereInput | null
    isNot?: ProductWhereInput | null
  }

  export type FileCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    url?: SortOrder
    size?: SortOrder
    productId?: SortOrder
  }

  export type FileAvgOrderByAggregateInput = {
    size?: SortOrder
  }

  export type FileMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    url?: SortOrder
    size?: SortOrder
    productId?: SortOrder
  }

  export type FileMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    url?: SortOrder
    size?: SortOrder
    productId?: SortOrder
  }

  export type FileSumOrderByAggregateInput = {
    size?: SortOrder
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type EnumModifierGroupTypeNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.ModifierGroupType | EnumModifierGroupTypeFieldRefInput<$PrismaModel> | null
    in?: $Enums.ModifierGroupType[] | ListEnumModifierGroupTypeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.ModifierGroupType[] | ListEnumModifierGroupTypeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumModifierGroupTypeNullableFilter<$PrismaModel> | $Enums.ModifierGroupType | null
  }

  export type ModifierGroupCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    title?: SortOrder
    required?: SortOrder
    type?: SortOrder
    productId?: SortOrder
    minSelection?: SortOrder
    maxSelection?: SortOrder
  }

  export type ModifierGroupAvgOrderByAggregateInput = {
    minSelection?: SortOrder
    maxSelection?: SortOrder
  }

  export type ModifierGroupMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    title?: SortOrder
    required?: SortOrder
    type?: SortOrder
    productId?: SortOrder
    minSelection?: SortOrder
    maxSelection?: SortOrder
  }

  export type ModifierGroupMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    title?: SortOrder
    required?: SortOrder
    type?: SortOrder
    productId?: SortOrder
    minSelection?: SortOrder
    maxSelection?: SortOrder
  }

  export type ModifierGroupSumOrderByAggregateInput = {
    minSelection?: SortOrder
    maxSelection?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type EnumModifierGroupTypeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ModifierGroupType | EnumModifierGroupTypeFieldRefInput<$PrismaModel> | null
    in?: $Enums.ModifierGroupType[] | ListEnumModifierGroupTypeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.ModifierGroupType[] | ListEnumModifierGroupTypeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumModifierGroupTypeNullableWithAggregatesFilter<$PrismaModel> | $Enums.ModifierGroupType | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumModifierGroupTypeNullableFilter<$PrismaModel>
    _max?: NestedEnumModifierGroupTypeNullableFilter<$PrismaModel>
  }

  export type BranchListRelationFilter = {
    every?: BranchWhereInput
    some?: BranchWhereInput
    none?: BranchWhereInput
  }

  export type BranchOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BusinessCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
  }

  export type BusinessMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
  }

  export type BusinessMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
  }

  export type AddressNullableScalarRelationFilter = {
    is?: AddressWhereInput | null
    isNot?: AddressWhereInput | null
  }

  export type BusinessNullableScalarRelationFilter = {
    is?: BusinessWhereInput | null
    isNot?: BusinessWhereInput | null
  }

  export type BranchCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    addressId?: SortOrder
    businessId?: SortOrder
  }

  export type BranchMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    addressId?: SortOrder
    businessId?: SortOrder
  }

  export type BranchMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    addressId?: SortOrder
    businessId?: SortOrder
  }

  export type BranchNullableScalarRelationFilter = {
    is?: BranchWhereInput | null
    isNot?: BranchWhereInput | null
  }

  export type OrderListRelationFilter = {
    every?: OrderWhereInput
    some?: OrderWhereInput
    none?: OrderWhereInput
  }

  export type OrderOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type AddressCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    description?: SortOrder
    googleMapsUrl?: SortOrder
  }

  export type AddressMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    description?: SortOrder
    googleMapsUrl?: SortOrder
  }

  export type AddressMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    description?: SortOrder
    googleMapsUrl?: SortOrder
  }

  export type FileListRelationFilter = {
    every?: FileWhereInput
    some?: FileWhereInput
    none?: FileWhereInput
  }

  export type ModifierGroupListRelationFilter = {
    every?: ModifierGroupWhereInput
    some?: ModifierGroupWhereInput
    none?: ModifierGroupWhereInput
  }

  export type CategoryNullableScalarRelationFilter = {
    is?: CategoryWhereInput | null
    isNot?: CategoryWhereInput | null
  }

  export type OrderProductsListRelationFilter = {
    every?: OrderProductsWhereInput
    some?: OrderProductsWhereInput
    none?: OrderProductsWhereInput
  }

  export type FileOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ModifierGroupOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type OrderProductsOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ProductCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    description?: SortOrder
    price?: SortOrder
    comparedAtPrice?: SortOrder
    categoryId?: SortOrder
  }

  export type ProductAvgOrderByAggregateInput = {
    price?: SortOrder
    comparedAtPrice?: SortOrder
  }

  export type ProductMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    description?: SortOrder
    price?: SortOrder
    comparedAtPrice?: SortOrder
    categoryId?: SortOrder
  }

  export type ProductMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    description?: SortOrder
    price?: SortOrder
    comparedAtPrice?: SortOrder
    categoryId?: SortOrder
  }

  export type ProductSumOrderByAggregateInput = {
    price?: SortOrder
    comparedAtPrice?: SortOrder
  }

  export type ProductListRelationFilter = {
    every?: ProductWhereInput
    some?: ProductWhereInput
    none?: ProductWhereInput
  }

  export type ProductOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CategoryCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
  }

  export type CategoryMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
  }

  export type CategoryMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type PromotialMessageListRelationFilter = {
    every?: PromotialMessageWhereInput
    some?: PromotialMessageWhereInput
    none?: PromotialMessageWhereInput
  }

  export type PromotialMessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CampaignCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    startedAt?: SortOrder
  }

  export type CampaignMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    startedAt?: SortOrder
  }

  export type CampaignMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    startedAt?: SortOrder
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type DeliveryAddressListRelationFilter = {
    every?: DeliveryAddressWhereInput
    some?: DeliveryAddressWhereInput
    none?: DeliveryAddressWhereInput
  }

  export type DeliveryAddressOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CustomerCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    address?: SortOrder
    lastMessageSent?: SortOrder
  }

  export type CustomerMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    address?: SortOrder
    lastMessageSent?: SortOrder
  }

  export type CustomerMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    address?: SortOrder
    lastMessageSent?: SortOrder
  }

  export type CustomerNullableScalarRelationFilter = {
    is?: CustomerWhereInput | null
    isNot?: CustomerWhereInput | null
  }

  export type DeliveryAddressCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    lat?: SortOrder
    lng?: SortOrder
    city?: SortOrder
    zipCode?: SortOrder
    State?: SortOrder
    street?: SortOrder
    number?: SortOrder
    description?: SortOrder
    complement?: SortOrder
    numberComplement?: SortOrder
    customerId?: SortOrder
  }

  export type DeliveryAddressMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    lat?: SortOrder
    lng?: SortOrder
    city?: SortOrder
    zipCode?: SortOrder
    State?: SortOrder
    street?: SortOrder
    number?: SortOrder
    description?: SortOrder
    complement?: SortOrder
    numberComplement?: SortOrder
    customerId?: SortOrder
  }

  export type DeliveryAddressMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    lat?: SortOrder
    lng?: SortOrder
    city?: SortOrder
    zipCode?: SortOrder
    State?: SortOrder
    street?: SortOrder
    number?: SortOrder
    description?: SortOrder
    complement?: SortOrder
    numberComplement?: SortOrder
    customerId?: SortOrder
  }

  export type MessageCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    content?: SortOrder
    media?: SortOrder
  }

  export type MessageMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    content?: SortOrder
    media?: SortOrder
  }

  export type MessageMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    name?: SortOrder
    content?: SortOrder
    media?: SortOrder
  }

  export type CampaignNullableScalarRelationFilter = {
    is?: CampaignWhereInput | null
    isNot?: CampaignWhereInput | null
  }

  export type MessageScalarRelationFilter = {
    is?: MessageWhereInput
    isNot?: MessageWhereInput
  }

  export type CustomerScalarRelationFilter = {
    is?: CustomerWhereInput
    isNot?: CustomerWhereInput
  }

  export type PromotialMessageCountOrderByAggregateInput = {
    id?: SortOrder
    sentAt?: SortOrder
    campaignId?: SortOrder
    messageId?: SortOrder
    customerId?: SortOrder
  }

  export type PromotialMessageMaxOrderByAggregateInput = {
    id?: SortOrder
    sentAt?: SortOrder
    campaignId?: SortOrder
    messageId?: SortOrder
    customerId?: SortOrder
  }

  export type PromotialMessageMinOrderByAggregateInput = {
    id?: SortOrder
    sentAt?: SortOrder
    campaignId?: SortOrder
    messageId?: SortOrder
    customerId?: SortOrder
  }

  export type EnumOrderTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.OrderType | EnumOrderTypeFieldRefInput<$PrismaModel>
    in?: $Enums.OrderType[] | ListEnumOrderTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.OrderType[] | ListEnumOrderTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumOrderTypeFilter<$PrismaModel> | $Enums.OrderType
  }

  export type EnumPaymentTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentType | EnumPaymentTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentType[] | ListEnumPaymentTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentType[] | ListEnumPaymentTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentTypeFilter<$PrismaModel> | $Enums.PaymentType
  }

  export type OrderCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    amount?: SortOrder
    type?: SortOrder
    paymentMethod?: SortOrder
    tipAmount?: SortOrder
    customerId?: SortOrder
    externalId?: SortOrder
    addressId?: SortOrder
  }

  export type OrderAvgOrderByAggregateInput = {
    amount?: SortOrder
    tipAmount?: SortOrder
  }

  export type OrderMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    amount?: SortOrder
    type?: SortOrder
    paymentMethod?: SortOrder
    tipAmount?: SortOrder
    customerId?: SortOrder
    externalId?: SortOrder
    addressId?: SortOrder
  }

  export type OrderMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    amount?: SortOrder
    type?: SortOrder
    paymentMethod?: SortOrder
    tipAmount?: SortOrder
    customerId?: SortOrder
    externalId?: SortOrder
    addressId?: SortOrder
  }

  export type OrderSumOrderByAggregateInput = {
    amount?: SortOrder
    tipAmount?: SortOrder
  }

  export type EnumOrderTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.OrderType | EnumOrderTypeFieldRefInput<$PrismaModel>
    in?: $Enums.OrderType[] | ListEnumOrderTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.OrderType[] | ListEnumOrderTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumOrderTypeWithAggregatesFilter<$PrismaModel> | $Enums.OrderType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumOrderTypeFilter<$PrismaModel>
    _max?: NestedEnumOrderTypeFilter<$PrismaModel>
  }

  export type EnumPaymentTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentType | EnumPaymentTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentType[] | ListEnumPaymentTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentType[] | ListEnumPaymentTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentTypeWithAggregatesFilter<$PrismaModel> | $Enums.PaymentType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentTypeFilter<$PrismaModel>
    _max?: NestedEnumPaymentTypeFilter<$PrismaModel>
  }

  export type ProductScalarRelationFilter = {
    is?: ProductWhereInput
    isNot?: ProductWhereInput
  }

  export type OrderNullableScalarRelationFilter = {
    is?: OrderWhereInput | null
    isNot?: OrderWhereInput | null
  }

  export type OrderProductsCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    productId?: SortOrder
    quantity?: SortOrder
    fullAmount?: SortOrder
    amount?: SortOrder
    orderId?: SortOrder
  }

  export type OrderProductsAvgOrderByAggregateInput = {
    quantity?: SortOrder
    fullAmount?: SortOrder
    amount?: SortOrder
  }

  export type OrderProductsMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    productId?: SortOrder
    quantity?: SortOrder
    fullAmount?: SortOrder
    amount?: SortOrder
    orderId?: SortOrder
  }

  export type OrderProductsMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    productId?: SortOrder
    quantity?: SortOrder
    fullAmount?: SortOrder
    amount?: SortOrder
    orderId?: SortOrder
  }

  export type OrderProductsSumOrderByAggregateInput = {
    quantity?: SortOrder
    fullAmount?: SortOrder
    amount?: SortOrder
  }

  export type ProgressiveDiscountStepCreateNestedManyWithoutProgressiveDiscountInput = {
    create?: XOR<ProgressiveDiscountStepCreateWithoutProgressiveDiscountInput, ProgressiveDiscountStepUncheckedCreateWithoutProgressiveDiscountInput> | ProgressiveDiscountStepCreateWithoutProgressiveDiscountInput[] | ProgressiveDiscountStepUncheckedCreateWithoutProgressiveDiscountInput[]
    connectOrCreate?: ProgressiveDiscountStepCreateOrConnectWithoutProgressiveDiscountInput | ProgressiveDiscountStepCreateOrConnectWithoutProgressiveDiscountInput[]
    createMany?: ProgressiveDiscountStepCreateManyProgressiveDiscountInputEnvelope
    connect?: ProgressiveDiscountStepWhereUniqueInput | ProgressiveDiscountStepWhereUniqueInput[]
  }

  export type ProgressiveDiscountStepUncheckedCreateNestedManyWithoutProgressiveDiscountInput = {
    create?: XOR<ProgressiveDiscountStepCreateWithoutProgressiveDiscountInput, ProgressiveDiscountStepUncheckedCreateWithoutProgressiveDiscountInput> | ProgressiveDiscountStepCreateWithoutProgressiveDiscountInput[] | ProgressiveDiscountStepUncheckedCreateWithoutProgressiveDiscountInput[]
    connectOrCreate?: ProgressiveDiscountStepCreateOrConnectWithoutProgressiveDiscountInput | ProgressiveDiscountStepCreateOrConnectWithoutProgressiveDiscountInput[]
    createMany?: ProgressiveDiscountStepCreateManyProgressiveDiscountInputEnvelope
    connect?: ProgressiveDiscountStepWhereUniqueInput | ProgressiveDiscountStepWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ProgressiveDiscountStepUpdateManyWithoutProgressiveDiscountNestedInput = {
    create?: XOR<ProgressiveDiscountStepCreateWithoutProgressiveDiscountInput, ProgressiveDiscountStepUncheckedCreateWithoutProgressiveDiscountInput> | ProgressiveDiscountStepCreateWithoutProgressiveDiscountInput[] | ProgressiveDiscountStepUncheckedCreateWithoutProgressiveDiscountInput[]
    connectOrCreate?: ProgressiveDiscountStepCreateOrConnectWithoutProgressiveDiscountInput | ProgressiveDiscountStepCreateOrConnectWithoutProgressiveDiscountInput[]
    upsert?: ProgressiveDiscountStepUpsertWithWhereUniqueWithoutProgressiveDiscountInput | ProgressiveDiscountStepUpsertWithWhereUniqueWithoutProgressiveDiscountInput[]
    createMany?: ProgressiveDiscountStepCreateManyProgressiveDiscountInputEnvelope
    set?: ProgressiveDiscountStepWhereUniqueInput | ProgressiveDiscountStepWhereUniqueInput[]
    disconnect?: ProgressiveDiscountStepWhereUniqueInput | ProgressiveDiscountStepWhereUniqueInput[]
    delete?: ProgressiveDiscountStepWhereUniqueInput | ProgressiveDiscountStepWhereUniqueInput[]
    connect?: ProgressiveDiscountStepWhereUniqueInput | ProgressiveDiscountStepWhereUniqueInput[]
    update?: ProgressiveDiscountStepUpdateWithWhereUniqueWithoutProgressiveDiscountInput | ProgressiveDiscountStepUpdateWithWhereUniqueWithoutProgressiveDiscountInput[]
    updateMany?: ProgressiveDiscountStepUpdateManyWithWhereWithoutProgressiveDiscountInput | ProgressiveDiscountStepUpdateManyWithWhereWithoutProgressiveDiscountInput[]
    deleteMany?: ProgressiveDiscountStepScalarWhereInput | ProgressiveDiscountStepScalarWhereInput[]
  }

  export type ProgressiveDiscountStepUncheckedUpdateManyWithoutProgressiveDiscountNestedInput = {
    create?: XOR<ProgressiveDiscountStepCreateWithoutProgressiveDiscountInput, ProgressiveDiscountStepUncheckedCreateWithoutProgressiveDiscountInput> | ProgressiveDiscountStepCreateWithoutProgressiveDiscountInput[] | ProgressiveDiscountStepUncheckedCreateWithoutProgressiveDiscountInput[]
    connectOrCreate?: ProgressiveDiscountStepCreateOrConnectWithoutProgressiveDiscountInput | ProgressiveDiscountStepCreateOrConnectWithoutProgressiveDiscountInput[]
    upsert?: ProgressiveDiscountStepUpsertWithWhereUniqueWithoutProgressiveDiscountInput | ProgressiveDiscountStepUpsertWithWhereUniqueWithoutProgressiveDiscountInput[]
    createMany?: ProgressiveDiscountStepCreateManyProgressiveDiscountInputEnvelope
    set?: ProgressiveDiscountStepWhereUniqueInput | ProgressiveDiscountStepWhereUniqueInput[]
    disconnect?: ProgressiveDiscountStepWhereUniqueInput | ProgressiveDiscountStepWhereUniqueInput[]
    delete?: ProgressiveDiscountStepWhereUniqueInput | ProgressiveDiscountStepWhereUniqueInput[]
    connect?: ProgressiveDiscountStepWhereUniqueInput | ProgressiveDiscountStepWhereUniqueInput[]
    update?: ProgressiveDiscountStepUpdateWithWhereUniqueWithoutProgressiveDiscountInput | ProgressiveDiscountStepUpdateWithWhereUniqueWithoutProgressiveDiscountInput[]
    updateMany?: ProgressiveDiscountStepUpdateManyWithWhereWithoutProgressiveDiscountInput | ProgressiveDiscountStepUpdateManyWithWhereWithoutProgressiveDiscountInput[]
    deleteMany?: ProgressiveDiscountStepScalarWhereInput | ProgressiveDiscountStepScalarWhereInput[]
  }

  export type ProgressiveDiscountCreateNestedOneWithoutStepsInput = {
    create?: XOR<ProgressiveDiscountCreateWithoutStepsInput, ProgressiveDiscountUncheckedCreateWithoutStepsInput>
    connectOrCreate?: ProgressiveDiscountCreateOrConnectWithoutStepsInput
    connect?: ProgressiveDiscountWhereUniqueInput
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type EnumProgressiveDiscountStepTypeFieldUpdateOperationsInput = {
    set?: $Enums.ProgressiveDiscountStepType
  }

  export type ProgressiveDiscountUpdateOneRequiredWithoutStepsNestedInput = {
    create?: XOR<ProgressiveDiscountCreateWithoutStepsInput, ProgressiveDiscountUncheckedCreateWithoutStepsInput>
    connectOrCreate?: ProgressiveDiscountCreateOrConnectWithoutStepsInput
    upsert?: ProgressiveDiscountUpsertWithoutStepsInput
    connect?: ProgressiveDiscountWhereUniqueInput
    update?: XOR<XOR<ProgressiveDiscountUpdateToOneWithWhereWithoutStepsInput, ProgressiveDiscountUpdateWithoutStepsInput>, ProgressiveDiscountUncheckedUpdateWithoutStepsInput>
  }

  export type ProductCreateNestedOneWithoutPhotosInput = {
    create?: XOR<ProductCreateWithoutPhotosInput, ProductUncheckedCreateWithoutPhotosInput>
    connectOrCreate?: ProductCreateOrConnectWithoutPhotosInput
    connect?: ProductWhereUniqueInput
  }

  export type ProductUpdateOneWithoutPhotosNestedInput = {
    create?: XOR<ProductCreateWithoutPhotosInput, ProductUncheckedCreateWithoutPhotosInput>
    connectOrCreate?: ProductCreateOrConnectWithoutPhotosInput
    upsert?: ProductUpsertWithoutPhotosInput
    disconnect?: ProductWhereInput | boolean
    delete?: ProductWhereInput | boolean
    connect?: ProductWhereUniqueInput
    update?: XOR<XOR<ProductUpdateToOneWithWhereWithoutPhotosInput, ProductUpdateWithoutPhotosInput>, ProductUncheckedUpdateWithoutPhotosInput>
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type ProductCreateNestedOneWithoutModifierGroupsInput = {
    create?: XOR<ProductCreateWithoutModifierGroupsInput, ProductUncheckedCreateWithoutModifierGroupsInput>
    connectOrCreate?: ProductCreateOrConnectWithoutModifierGroupsInput
    connect?: ProductWhereUniqueInput
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NullableEnumModifierGroupTypeFieldUpdateOperationsInput = {
    set?: $Enums.ModifierGroupType | null
  }

  export type ProductUpdateOneWithoutModifierGroupsNestedInput = {
    create?: XOR<ProductCreateWithoutModifierGroupsInput, ProductUncheckedCreateWithoutModifierGroupsInput>
    connectOrCreate?: ProductCreateOrConnectWithoutModifierGroupsInput
    upsert?: ProductUpsertWithoutModifierGroupsInput
    disconnect?: ProductWhereInput | boolean
    delete?: ProductWhereInput | boolean
    connect?: ProductWhereUniqueInput
    update?: XOR<XOR<ProductUpdateToOneWithWhereWithoutModifierGroupsInput, ProductUpdateWithoutModifierGroupsInput>, ProductUncheckedUpdateWithoutModifierGroupsInput>
  }

  export type BranchCreateNestedManyWithoutBusinessInput = {
    create?: XOR<BranchCreateWithoutBusinessInput, BranchUncheckedCreateWithoutBusinessInput> | BranchCreateWithoutBusinessInput[] | BranchUncheckedCreateWithoutBusinessInput[]
    connectOrCreate?: BranchCreateOrConnectWithoutBusinessInput | BranchCreateOrConnectWithoutBusinessInput[]
    createMany?: BranchCreateManyBusinessInputEnvelope
    connect?: BranchWhereUniqueInput | BranchWhereUniqueInput[]
  }

  export type BranchUncheckedCreateNestedManyWithoutBusinessInput = {
    create?: XOR<BranchCreateWithoutBusinessInput, BranchUncheckedCreateWithoutBusinessInput> | BranchCreateWithoutBusinessInput[] | BranchUncheckedCreateWithoutBusinessInput[]
    connectOrCreate?: BranchCreateOrConnectWithoutBusinessInput | BranchCreateOrConnectWithoutBusinessInput[]
    createMany?: BranchCreateManyBusinessInputEnvelope
    connect?: BranchWhereUniqueInput | BranchWhereUniqueInput[]
  }

  export type BranchUpdateManyWithoutBusinessNestedInput = {
    create?: XOR<BranchCreateWithoutBusinessInput, BranchUncheckedCreateWithoutBusinessInput> | BranchCreateWithoutBusinessInput[] | BranchUncheckedCreateWithoutBusinessInput[]
    connectOrCreate?: BranchCreateOrConnectWithoutBusinessInput | BranchCreateOrConnectWithoutBusinessInput[]
    upsert?: BranchUpsertWithWhereUniqueWithoutBusinessInput | BranchUpsertWithWhereUniqueWithoutBusinessInput[]
    createMany?: BranchCreateManyBusinessInputEnvelope
    set?: BranchWhereUniqueInput | BranchWhereUniqueInput[]
    disconnect?: BranchWhereUniqueInput | BranchWhereUniqueInput[]
    delete?: BranchWhereUniqueInput | BranchWhereUniqueInput[]
    connect?: BranchWhereUniqueInput | BranchWhereUniqueInput[]
    update?: BranchUpdateWithWhereUniqueWithoutBusinessInput | BranchUpdateWithWhereUniqueWithoutBusinessInput[]
    updateMany?: BranchUpdateManyWithWhereWithoutBusinessInput | BranchUpdateManyWithWhereWithoutBusinessInput[]
    deleteMany?: BranchScalarWhereInput | BranchScalarWhereInput[]
  }

  export type BranchUncheckedUpdateManyWithoutBusinessNestedInput = {
    create?: XOR<BranchCreateWithoutBusinessInput, BranchUncheckedCreateWithoutBusinessInput> | BranchCreateWithoutBusinessInput[] | BranchUncheckedCreateWithoutBusinessInput[]
    connectOrCreate?: BranchCreateOrConnectWithoutBusinessInput | BranchCreateOrConnectWithoutBusinessInput[]
    upsert?: BranchUpsertWithWhereUniqueWithoutBusinessInput | BranchUpsertWithWhereUniqueWithoutBusinessInput[]
    createMany?: BranchCreateManyBusinessInputEnvelope
    set?: BranchWhereUniqueInput | BranchWhereUniqueInput[]
    disconnect?: BranchWhereUniqueInput | BranchWhereUniqueInput[]
    delete?: BranchWhereUniqueInput | BranchWhereUniqueInput[]
    connect?: BranchWhereUniqueInput | BranchWhereUniqueInput[]
    update?: BranchUpdateWithWhereUniqueWithoutBusinessInput | BranchUpdateWithWhereUniqueWithoutBusinessInput[]
    updateMany?: BranchUpdateManyWithWhereWithoutBusinessInput | BranchUpdateManyWithWhereWithoutBusinessInput[]
    deleteMany?: BranchScalarWhereInput | BranchScalarWhereInput[]
  }

  export type AddressCreateNestedOneWithoutBranchInput = {
    create?: XOR<AddressCreateWithoutBranchInput, AddressUncheckedCreateWithoutBranchInput>
    connectOrCreate?: AddressCreateOrConnectWithoutBranchInput
    connect?: AddressWhereUniqueInput
  }

  export type BusinessCreateNestedOneWithoutBranchesInput = {
    create?: XOR<BusinessCreateWithoutBranchesInput, BusinessUncheckedCreateWithoutBranchesInput>
    connectOrCreate?: BusinessCreateOrConnectWithoutBranchesInput
    connect?: BusinessWhereUniqueInput
  }

  export type AddressUpdateOneWithoutBranchNestedInput = {
    create?: XOR<AddressCreateWithoutBranchInput, AddressUncheckedCreateWithoutBranchInput>
    connectOrCreate?: AddressCreateOrConnectWithoutBranchInput
    upsert?: AddressUpsertWithoutBranchInput
    disconnect?: AddressWhereInput | boolean
    delete?: AddressWhereInput | boolean
    connect?: AddressWhereUniqueInput
    update?: XOR<XOR<AddressUpdateToOneWithWhereWithoutBranchInput, AddressUpdateWithoutBranchInput>, AddressUncheckedUpdateWithoutBranchInput>
  }

  export type BusinessUpdateOneWithoutBranchesNestedInput = {
    create?: XOR<BusinessCreateWithoutBranchesInput, BusinessUncheckedCreateWithoutBranchesInput>
    connectOrCreate?: BusinessCreateOrConnectWithoutBranchesInput
    upsert?: BusinessUpsertWithoutBranchesInput
    disconnect?: BusinessWhereInput | boolean
    delete?: BusinessWhereInput | boolean
    connect?: BusinessWhereUniqueInput
    update?: XOR<XOR<BusinessUpdateToOneWithWhereWithoutBranchesInput, BusinessUpdateWithoutBranchesInput>, BusinessUncheckedUpdateWithoutBranchesInput>
  }

  export type BranchCreateNestedOneWithoutAddressInput = {
    create?: XOR<BranchCreateWithoutAddressInput, BranchUncheckedCreateWithoutAddressInput>
    connectOrCreate?: BranchCreateOrConnectWithoutAddressInput
    connect?: BranchWhereUniqueInput
  }

  export type OrderCreateNestedManyWithoutAddressInput = {
    create?: XOR<OrderCreateWithoutAddressInput, OrderUncheckedCreateWithoutAddressInput> | OrderCreateWithoutAddressInput[] | OrderUncheckedCreateWithoutAddressInput[]
    connectOrCreate?: OrderCreateOrConnectWithoutAddressInput | OrderCreateOrConnectWithoutAddressInput[]
    createMany?: OrderCreateManyAddressInputEnvelope
    connect?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
  }

  export type BranchUncheckedCreateNestedOneWithoutAddressInput = {
    create?: XOR<BranchCreateWithoutAddressInput, BranchUncheckedCreateWithoutAddressInput>
    connectOrCreate?: BranchCreateOrConnectWithoutAddressInput
    connect?: BranchWhereUniqueInput
  }

  export type OrderUncheckedCreateNestedManyWithoutAddressInput = {
    create?: XOR<OrderCreateWithoutAddressInput, OrderUncheckedCreateWithoutAddressInput> | OrderCreateWithoutAddressInput[] | OrderUncheckedCreateWithoutAddressInput[]
    connectOrCreate?: OrderCreateOrConnectWithoutAddressInput | OrderCreateOrConnectWithoutAddressInput[]
    createMany?: OrderCreateManyAddressInputEnvelope
    connect?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
  }

  export type BranchUpdateOneWithoutAddressNestedInput = {
    create?: XOR<BranchCreateWithoutAddressInput, BranchUncheckedCreateWithoutAddressInput>
    connectOrCreate?: BranchCreateOrConnectWithoutAddressInput
    upsert?: BranchUpsertWithoutAddressInput
    disconnect?: BranchWhereInput | boolean
    delete?: BranchWhereInput | boolean
    connect?: BranchWhereUniqueInput
    update?: XOR<XOR<BranchUpdateToOneWithWhereWithoutAddressInput, BranchUpdateWithoutAddressInput>, BranchUncheckedUpdateWithoutAddressInput>
  }

  export type OrderUpdateManyWithoutAddressNestedInput = {
    create?: XOR<OrderCreateWithoutAddressInput, OrderUncheckedCreateWithoutAddressInput> | OrderCreateWithoutAddressInput[] | OrderUncheckedCreateWithoutAddressInput[]
    connectOrCreate?: OrderCreateOrConnectWithoutAddressInput | OrderCreateOrConnectWithoutAddressInput[]
    upsert?: OrderUpsertWithWhereUniqueWithoutAddressInput | OrderUpsertWithWhereUniqueWithoutAddressInput[]
    createMany?: OrderCreateManyAddressInputEnvelope
    set?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    disconnect?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    delete?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    connect?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    update?: OrderUpdateWithWhereUniqueWithoutAddressInput | OrderUpdateWithWhereUniqueWithoutAddressInput[]
    updateMany?: OrderUpdateManyWithWhereWithoutAddressInput | OrderUpdateManyWithWhereWithoutAddressInput[]
    deleteMany?: OrderScalarWhereInput | OrderScalarWhereInput[]
  }

  export type BranchUncheckedUpdateOneWithoutAddressNestedInput = {
    create?: XOR<BranchCreateWithoutAddressInput, BranchUncheckedCreateWithoutAddressInput>
    connectOrCreate?: BranchCreateOrConnectWithoutAddressInput
    upsert?: BranchUpsertWithoutAddressInput
    disconnect?: BranchWhereInput | boolean
    delete?: BranchWhereInput | boolean
    connect?: BranchWhereUniqueInput
    update?: XOR<XOR<BranchUpdateToOneWithWhereWithoutAddressInput, BranchUpdateWithoutAddressInput>, BranchUncheckedUpdateWithoutAddressInput>
  }

  export type OrderUncheckedUpdateManyWithoutAddressNestedInput = {
    create?: XOR<OrderCreateWithoutAddressInput, OrderUncheckedCreateWithoutAddressInput> | OrderCreateWithoutAddressInput[] | OrderUncheckedCreateWithoutAddressInput[]
    connectOrCreate?: OrderCreateOrConnectWithoutAddressInput | OrderCreateOrConnectWithoutAddressInput[]
    upsert?: OrderUpsertWithWhereUniqueWithoutAddressInput | OrderUpsertWithWhereUniqueWithoutAddressInput[]
    createMany?: OrderCreateManyAddressInputEnvelope
    set?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    disconnect?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    delete?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    connect?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    update?: OrderUpdateWithWhereUniqueWithoutAddressInput | OrderUpdateWithWhereUniqueWithoutAddressInput[]
    updateMany?: OrderUpdateManyWithWhereWithoutAddressInput | OrderUpdateManyWithWhereWithoutAddressInput[]
    deleteMany?: OrderScalarWhereInput | OrderScalarWhereInput[]
  }

  export type FileCreateNestedManyWithoutProductInput = {
    create?: XOR<FileCreateWithoutProductInput, FileUncheckedCreateWithoutProductInput> | FileCreateWithoutProductInput[] | FileUncheckedCreateWithoutProductInput[]
    connectOrCreate?: FileCreateOrConnectWithoutProductInput | FileCreateOrConnectWithoutProductInput[]
    createMany?: FileCreateManyProductInputEnvelope
    connect?: FileWhereUniqueInput | FileWhereUniqueInput[]
  }

  export type ModifierGroupCreateNestedManyWithoutProductInput = {
    create?: XOR<ModifierGroupCreateWithoutProductInput, ModifierGroupUncheckedCreateWithoutProductInput> | ModifierGroupCreateWithoutProductInput[] | ModifierGroupUncheckedCreateWithoutProductInput[]
    connectOrCreate?: ModifierGroupCreateOrConnectWithoutProductInput | ModifierGroupCreateOrConnectWithoutProductInput[]
    createMany?: ModifierGroupCreateManyProductInputEnvelope
    connect?: ModifierGroupWhereUniqueInput | ModifierGroupWhereUniqueInput[]
  }

  export type CategoryCreateNestedOneWithoutProductsInput = {
    create?: XOR<CategoryCreateWithoutProductsInput, CategoryUncheckedCreateWithoutProductsInput>
    connectOrCreate?: CategoryCreateOrConnectWithoutProductsInput
    connect?: CategoryWhereUniqueInput
  }

  export type OrderProductsCreateNestedManyWithoutProductInput = {
    create?: XOR<OrderProductsCreateWithoutProductInput, OrderProductsUncheckedCreateWithoutProductInput> | OrderProductsCreateWithoutProductInput[] | OrderProductsUncheckedCreateWithoutProductInput[]
    connectOrCreate?: OrderProductsCreateOrConnectWithoutProductInput | OrderProductsCreateOrConnectWithoutProductInput[]
    createMany?: OrderProductsCreateManyProductInputEnvelope
    connect?: OrderProductsWhereUniqueInput | OrderProductsWhereUniqueInput[]
  }

  export type FileUncheckedCreateNestedManyWithoutProductInput = {
    create?: XOR<FileCreateWithoutProductInput, FileUncheckedCreateWithoutProductInput> | FileCreateWithoutProductInput[] | FileUncheckedCreateWithoutProductInput[]
    connectOrCreate?: FileCreateOrConnectWithoutProductInput | FileCreateOrConnectWithoutProductInput[]
    createMany?: FileCreateManyProductInputEnvelope
    connect?: FileWhereUniqueInput | FileWhereUniqueInput[]
  }

  export type ModifierGroupUncheckedCreateNestedManyWithoutProductInput = {
    create?: XOR<ModifierGroupCreateWithoutProductInput, ModifierGroupUncheckedCreateWithoutProductInput> | ModifierGroupCreateWithoutProductInput[] | ModifierGroupUncheckedCreateWithoutProductInput[]
    connectOrCreate?: ModifierGroupCreateOrConnectWithoutProductInput | ModifierGroupCreateOrConnectWithoutProductInput[]
    createMany?: ModifierGroupCreateManyProductInputEnvelope
    connect?: ModifierGroupWhereUniqueInput | ModifierGroupWhereUniqueInput[]
  }

  export type OrderProductsUncheckedCreateNestedManyWithoutProductInput = {
    create?: XOR<OrderProductsCreateWithoutProductInput, OrderProductsUncheckedCreateWithoutProductInput> | OrderProductsCreateWithoutProductInput[] | OrderProductsUncheckedCreateWithoutProductInput[]
    connectOrCreate?: OrderProductsCreateOrConnectWithoutProductInput | OrderProductsCreateOrConnectWithoutProductInput[]
    createMany?: OrderProductsCreateManyProductInputEnvelope
    connect?: OrderProductsWhereUniqueInput | OrderProductsWhereUniqueInput[]
  }

  export type FileUpdateManyWithoutProductNestedInput = {
    create?: XOR<FileCreateWithoutProductInput, FileUncheckedCreateWithoutProductInput> | FileCreateWithoutProductInput[] | FileUncheckedCreateWithoutProductInput[]
    connectOrCreate?: FileCreateOrConnectWithoutProductInput | FileCreateOrConnectWithoutProductInput[]
    upsert?: FileUpsertWithWhereUniqueWithoutProductInput | FileUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: FileCreateManyProductInputEnvelope
    set?: FileWhereUniqueInput | FileWhereUniqueInput[]
    disconnect?: FileWhereUniqueInput | FileWhereUniqueInput[]
    delete?: FileWhereUniqueInput | FileWhereUniqueInput[]
    connect?: FileWhereUniqueInput | FileWhereUniqueInput[]
    update?: FileUpdateWithWhereUniqueWithoutProductInput | FileUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: FileUpdateManyWithWhereWithoutProductInput | FileUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: FileScalarWhereInput | FileScalarWhereInput[]
  }

  export type ModifierGroupUpdateManyWithoutProductNestedInput = {
    create?: XOR<ModifierGroupCreateWithoutProductInput, ModifierGroupUncheckedCreateWithoutProductInput> | ModifierGroupCreateWithoutProductInput[] | ModifierGroupUncheckedCreateWithoutProductInput[]
    connectOrCreate?: ModifierGroupCreateOrConnectWithoutProductInput | ModifierGroupCreateOrConnectWithoutProductInput[]
    upsert?: ModifierGroupUpsertWithWhereUniqueWithoutProductInput | ModifierGroupUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: ModifierGroupCreateManyProductInputEnvelope
    set?: ModifierGroupWhereUniqueInput | ModifierGroupWhereUniqueInput[]
    disconnect?: ModifierGroupWhereUniqueInput | ModifierGroupWhereUniqueInput[]
    delete?: ModifierGroupWhereUniqueInput | ModifierGroupWhereUniqueInput[]
    connect?: ModifierGroupWhereUniqueInput | ModifierGroupWhereUniqueInput[]
    update?: ModifierGroupUpdateWithWhereUniqueWithoutProductInput | ModifierGroupUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: ModifierGroupUpdateManyWithWhereWithoutProductInput | ModifierGroupUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: ModifierGroupScalarWhereInput | ModifierGroupScalarWhereInput[]
  }

  export type CategoryUpdateOneWithoutProductsNestedInput = {
    create?: XOR<CategoryCreateWithoutProductsInput, CategoryUncheckedCreateWithoutProductsInput>
    connectOrCreate?: CategoryCreateOrConnectWithoutProductsInput
    upsert?: CategoryUpsertWithoutProductsInput
    disconnect?: CategoryWhereInput | boolean
    delete?: CategoryWhereInput | boolean
    connect?: CategoryWhereUniqueInput
    update?: XOR<XOR<CategoryUpdateToOneWithWhereWithoutProductsInput, CategoryUpdateWithoutProductsInput>, CategoryUncheckedUpdateWithoutProductsInput>
  }

  export type OrderProductsUpdateManyWithoutProductNestedInput = {
    create?: XOR<OrderProductsCreateWithoutProductInput, OrderProductsUncheckedCreateWithoutProductInput> | OrderProductsCreateWithoutProductInput[] | OrderProductsUncheckedCreateWithoutProductInput[]
    connectOrCreate?: OrderProductsCreateOrConnectWithoutProductInput | OrderProductsCreateOrConnectWithoutProductInput[]
    upsert?: OrderProductsUpsertWithWhereUniqueWithoutProductInput | OrderProductsUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: OrderProductsCreateManyProductInputEnvelope
    set?: OrderProductsWhereUniqueInput | OrderProductsWhereUniqueInput[]
    disconnect?: OrderProductsWhereUniqueInput | OrderProductsWhereUniqueInput[]
    delete?: OrderProductsWhereUniqueInput | OrderProductsWhereUniqueInput[]
    connect?: OrderProductsWhereUniqueInput | OrderProductsWhereUniqueInput[]
    update?: OrderProductsUpdateWithWhereUniqueWithoutProductInput | OrderProductsUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: OrderProductsUpdateManyWithWhereWithoutProductInput | OrderProductsUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: OrderProductsScalarWhereInput | OrderProductsScalarWhereInput[]
  }

  export type FileUncheckedUpdateManyWithoutProductNestedInput = {
    create?: XOR<FileCreateWithoutProductInput, FileUncheckedCreateWithoutProductInput> | FileCreateWithoutProductInput[] | FileUncheckedCreateWithoutProductInput[]
    connectOrCreate?: FileCreateOrConnectWithoutProductInput | FileCreateOrConnectWithoutProductInput[]
    upsert?: FileUpsertWithWhereUniqueWithoutProductInput | FileUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: FileCreateManyProductInputEnvelope
    set?: FileWhereUniqueInput | FileWhereUniqueInput[]
    disconnect?: FileWhereUniqueInput | FileWhereUniqueInput[]
    delete?: FileWhereUniqueInput | FileWhereUniqueInput[]
    connect?: FileWhereUniqueInput | FileWhereUniqueInput[]
    update?: FileUpdateWithWhereUniqueWithoutProductInput | FileUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: FileUpdateManyWithWhereWithoutProductInput | FileUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: FileScalarWhereInput | FileScalarWhereInput[]
  }

  export type ModifierGroupUncheckedUpdateManyWithoutProductNestedInput = {
    create?: XOR<ModifierGroupCreateWithoutProductInput, ModifierGroupUncheckedCreateWithoutProductInput> | ModifierGroupCreateWithoutProductInput[] | ModifierGroupUncheckedCreateWithoutProductInput[]
    connectOrCreate?: ModifierGroupCreateOrConnectWithoutProductInput | ModifierGroupCreateOrConnectWithoutProductInput[]
    upsert?: ModifierGroupUpsertWithWhereUniqueWithoutProductInput | ModifierGroupUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: ModifierGroupCreateManyProductInputEnvelope
    set?: ModifierGroupWhereUniqueInput | ModifierGroupWhereUniqueInput[]
    disconnect?: ModifierGroupWhereUniqueInput | ModifierGroupWhereUniqueInput[]
    delete?: ModifierGroupWhereUniqueInput | ModifierGroupWhereUniqueInput[]
    connect?: ModifierGroupWhereUniqueInput | ModifierGroupWhereUniqueInput[]
    update?: ModifierGroupUpdateWithWhereUniqueWithoutProductInput | ModifierGroupUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: ModifierGroupUpdateManyWithWhereWithoutProductInput | ModifierGroupUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: ModifierGroupScalarWhereInput | ModifierGroupScalarWhereInput[]
  }

  export type OrderProductsUncheckedUpdateManyWithoutProductNestedInput = {
    create?: XOR<OrderProductsCreateWithoutProductInput, OrderProductsUncheckedCreateWithoutProductInput> | OrderProductsCreateWithoutProductInput[] | OrderProductsUncheckedCreateWithoutProductInput[]
    connectOrCreate?: OrderProductsCreateOrConnectWithoutProductInput | OrderProductsCreateOrConnectWithoutProductInput[]
    upsert?: OrderProductsUpsertWithWhereUniqueWithoutProductInput | OrderProductsUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: OrderProductsCreateManyProductInputEnvelope
    set?: OrderProductsWhereUniqueInput | OrderProductsWhereUniqueInput[]
    disconnect?: OrderProductsWhereUniqueInput | OrderProductsWhereUniqueInput[]
    delete?: OrderProductsWhereUniqueInput | OrderProductsWhereUniqueInput[]
    connect?: OrderProductsWhereUniqueInput | OrderProductsWhereUniqueInput[]
    update?: OrderProductsUpdateWithWhereUniqueWithoutProductInput | OrderProductsUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: OrderProductsUpdateManyWithWhereWithoutProductInput | OrderProductsUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: OrderProductsScalarWhereInput | OrderProductsScalarWhereInput[]
  }

  export type ProductCreateNestedManyWithoutCategoryInput = {
    create?: XOR<ProductCreateWithoutCategoryInput, ProductUncheckedCreateWithoutCategoryInput> | ProductCreateWithoutCategoryInput[] | ProductUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: ProductCreateOrConnectWithoutCategoryInput | ProductCreateOrConnectWithoutCategoryInput[]
    createMany?: ProductCreateManyCategoryInputEnvelope
    connect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
  }

  export type ProductUncheckedCreateNestedManyWithoutCategoryInput = {
    create?: XOR<ProductCreateWithoutCategoryInput, ProductUncheckedCreateWithoutCategoryInput> | ProductCreateWithoutCategoryInput[] | ProductUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: ProductCreateOrConnectWithoutCategoryInput | ProductCreateOrConnectWithoutCategoryInput[]
    createMany?: ProductCreateManyCategoryInputEnvelope
    connect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
  }

  export type ProductUpdateManyWithoutCategoryNestedInput = {
    create?: XOR<ProductCreateWithoutCategoryInput, ProductUncheckedCreateWithoutCategoryInput> | ProductCreateWithoutCategoryInput[] | ProductUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: ProductCreateOrConnectWithoutCategoryInput | ProductCreateOrConnectWithoutCategoryInput[]
    upsert?: ProductUpsertWithWhereUniqueWithoutCategoryInput | ProductUpsertWithWhereUniqueWithoutCategoryInput[]
    createMany?: ProductCreateManyCategoryInputEnvelope
    set?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    disconnect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    delete?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    connect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    update?: ProductUpdateWithWhereUniqueWithoutCategoryInput | ProductUpdateWithWhereUniqueWithoutCategoryInput[]
    updateMany?: ProductUpdateManyWithWhereWithoutCategoryInput | ProductUpdateManyWithWhereWithoutCategoryInput[]
    deleteMany?: ProductScalarWhereInput | ProductScalarWhereInput[]
  }

  export type ProductUncheckedUpdateManyWithoutCategoryNestedInput = {
    create?: XOR<ProductCreateWithoutCategoryInput, ProductUncheckedCreateWithoutCategoryInput> | ProductCreateWithoutCategoryInput[] | ProductUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: ProductCreateOrConnectWithoutCategoryInput | ProductCreateOrConnectWithoutCategoryInput[]
    upsert?: ProductUpsertWithWhereUniqueWithoutCategoryInput | ProductUpsertWithWhereUniqueWithoutCategoryInput[]
    createMany?: ProductCreateManyCategoryInputEnvelope
    set?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    disconnect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    delete?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    connect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    update?: ProductUpdateWithWhereUniqueWithoutCategoryInput | ProductUpdateWithWhereUniqueWithoutCategoryInput[]
    updateMany?: ProductUpdateManyWithWhereWithoutCategoryInput | ProductUpdateManyWithWhereWithoutCategoryInput[]
    deleteMany?: ProductScalarWhereInput | ProductScalarWhereInput[]
  }

  export type PromotialMessageCreateNestedManyWithoutCampaignInput = {
    create?: XOR<PromotialMessageCreateWithoutCampaignInput, PromotialMessageUncheckedCreateWithoutCampaignInput> | PromotialMessageCreateWithoutCampaignInput[] | PromotialMessageUncheckedCreateWithoutCampaignInput[]
    connectOrCreate?: PromotialMessageCreateOrConnectWithoutCampaignInput | PromotialMessageCreateOrConnectWithoutCampaignInput[]
    createMany?: PromotialMessageCreateManyCampaignInputEnvelope
    connect?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
  }

  export type PromotialMessageUncheckedCreateNestedManyWithoutCampaignInput = {
    create?: XOR<PromotialMessageCreateWithoutCampaignInput, PromotialMessageUncheckedCreateWithoutCampaignInput> | PromotialMessageCreateWithoutCampaignInput[] | PromotialMessageUncheckedCreateWithoutCampaignInput[]
    connectOrCreate?: PromotialMessageCreateOrConnectWithoutCampaignInput | PromotialMessageCreateOrConnectWithoutCampaignInput[]
    createMany?: PromotialMessageCreateManyCampaignInputEnvelope
    connect?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type PromotialMessageUpdateManyWithoutCampaignNestedInput = {
    create?: XOR<PromotialMessageCreateWithoutCampaignInput, PromotialMessageUncheckedCreateWithoutCampaignInput> | PromotialMessageCreateWithoutCampaignInput[] | PromotialMessageUncheckedCreateWithoutCampaignInput[]
    connectOrCreate?: PromotialMessageCreateOrConnectWithoutCampaignInput | PromotialMessageCreateOrConnectWithoutCampaignInput[]
    upsert?: PromotialMessageUpsertWithWhereUniqueWithoutCampaignInput | PromotialMessageUpsertWithWhereUniqueWithoutCampaignInput[]
    createMany?: PromotialMessageCreateManyCampaignInputEnvelope
    set?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    disconnect?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    delete?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    connect?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    update?: PromotialMessageUpdateWithWhereUniqueWithoutCampaignInput | PromotialMessageUpdateWithWhereUniqueWithoutCampaignInput[]
    updateMany?: PromotialMessageUpdateManyWithWhereWithoutCampaignInput | PromotialMessageUpdateManyWithWhereWithoutCampaignInput[]
    deleteMany?: PromotialMessageScalarWhereInput | PromotialMessageScalarWhereInput[]
  }

  export type PromotialMessageUncheckedUpdateManyWithoutCampaignNestedInput = {
    create?: XOR<PromotialMessageCreateWithoutCampaignInput, PromotialMessageUncheckedCreateWithoutCampaignInput> | PromotialMessageCreateWithoutCampaignInput[] | PromotialMessageUncheckedCreateWithoutCampaignInput[]
    connectOrCreate?: PromotialMessageCreateOrConnectWithoutCampaignInput | PromotialMessageCreateOrConnectWithoutCampaignInput[]
    upsert?: PromotialMessageUpsertWithWhereUniqueWithoutCampaignInput | PromotialMessageUpsertWithWhereUniqueWithoutCampaignInput[]
    createMany?: PromotialMessageCreateManyCampaignInputEnvelope
    set?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    disconnect?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    delete?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    connect?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    update?: PromotialMessageUpdateWithWhereUniqueWithoutCampaignInput | PromotialMessageUpdateWithWhereUniqueWithoutCampaignInput[]
    updateMany?: PromotialMessageUpdateManyWithWhereWithoutCampaignInput | PromotialMessageUpdateManyWithWhereWithoutCampaignInput[]
    deleteMany?: PromotialMessageScalarWhereInput | PromotialMessageScalarWhereInput[]
  }

  export type OrderCreateNestedManyWithoutCustomerInput = {
    create?: XOR<OrderCreateWithoutCustomerInput, OrderUncheckedCreateWithoutCustomerInput> | OrderCreateWithoutCustomerInput[] | OrderUncheckedCreateWithoutCustomerInput[]
    connectOrCreate?: OrderCreateOrConnectWithoutCustomerInput | OrderCreateOrConnectWithoutCustomerInput[]
    createMany?: OrderCreateManyCustomerInputEnvelope
    connect?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
  }

  export type PromotialMessageCreateNestedManyWithoutCustomerInput = {
    create?: XOR<PromotialMessageCreateWithoutCustomerInput, PromotialMessageUncheckedCreateWithoutCustomerInput> | PromotialMessageCreateWithoutCustomerInput[] | PromotialMessageUncheckedCreateWithoutCustomerInput[]
    connectOrCreate?: PromotialMessageCreateOrConnectWithoutCustomerInput | PromotialMessageCreateOrConnectWithoutCustomerInput[]
    createMany?: PromotialMessageCreateManyCustomerInputEnvelope
    connect?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
  }

  export type DeliveryAddressCreateNestedManyWithoutCustomerInput = {
    create?: XOR<DeliveryAddressCreateWithoutCustomerInput, DeliveryAddressUncheckedCreateWithoutCustomerInput> | DeliveryAddressCreateWithoutCustomerInput[] | DeliveryAddressUncheckedCreateWithoutCustomerInput[]
    connectOrCreate?: DeliveryAddressCreateOrConnectWithoutCustomerInput | DeliveryAddressCreateOrConnectWithoutCustomerInput[]
    createMany?: DeliveryAddressCreateManyCustomerInputEnvelope
    connect?: DeliveryAddressWhereUniqueInput | DeliveryAddressWhereUniqueInput[]
  }

  export type OrderUncheckedCreateNestedManyWithoutCustomerInput = {
    create?: XOR<OrderCreateWithoutCustomerInput, OrderUncheckedCreateWithoutCustomerInput> | OrderCreateWithoutCustomerInput[] | OrderUncheckedCreateWithoutCustomerInput[]
    connectOrCreate?: OrderCreateOrConnectWithoutCustomerInput | OrderCreateOrConnectWithoutCustomerInput[]
    createMany?: OrderCreateManyCustomerInputEnvelope
    connect?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
  }

  export type PromotialMessageUncheckedCreateNestedManyWithoutCustomerInput = {
    create?: XOR<PromotialMessageCreateWithoutCustomerInput, PromotialMessageUncheckedCreateWithoutCustomerInput> | PromotialMessageCreateWithoutCustomerInput[] | PromotialMessageUncheckedCreateWithoutCustomerInput[]
    connectOrCreate?: PromotialMessageCreateOrConnectWithoutCustomerInput | PromotialMessageCreateOrConnectWithoutCustomerInput[]
    createMany?: PromotialMessageCreateManyCustomerInputEnvelope
    connect?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
  }

  export type DeliveryAddressUncheckedCreateNestedManyWithoutCustomerInput = {
    create?: XOR<DeliveryAddressCreateWithoutCustomerInput, DeliveryAddressUncheckedCreateWithoutCustomerInput> | DeliveryAddressCreateWithoutCustomerInput[] | DeliveryAddressUncheckedCreateWithoutCustomerInput[]
    connectOrCreate?: DeliveryAddressCreateOrConnectWithoutCustomerInput | DeliveryAddressCreateOrConnectWithoutCustomerInput[]
    createMany?: DeliveryAddressCreateManyCustomerInputEnvelope
    connect?: DeliveryAddressWhereUniqueInput | DeliveryAddressWhereUniqueInput[]
  }

  export type OrderUpdateManyWithoutCustomerNestedInput = {
    create?: XOR<OrderCreateWithoutCustomerInput, OrderUncheckedCreateWithoutCustomerInput> | OrderCreateWithoutCustomerInput[] | OrderUncheckedCreateWithoutCustomerInput[]
    connectOrCreate?: OrderCreateOrConnectWithoutCustomerInput | OrderCreateOrConnectWithoutCustomerInput[]
    upsert?: OrderUpsertWithWhereUniqueWithoutCustomerInput | OrderUpsertWithWhereUniqueWithoutCustomerInput[]
    createMany?: OrderCreateManyCustomerInputEnvelope
    set?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    disconnect?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    delete?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    connect?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    update?: OrderUpdateWithWhereUniqueWithoutCustomerInput | OrderUpdateWithWhereUniqueWithoutCustomerInput[]
    updateMany?: OrderUpdateManyWithWhereWithoutCustomerInput | OrderUpdateManyWithWhereWithoutCustomerInput[]
    deleteMany?: OrderScalarWhereInput | OrderScalarWhereInput[]
  }

  export type PromotialMessageUpdateManyWithoutCustomerNestedInput = {
    create?: XOR<PromotialMessageCreateWithoutCustomerInput, PromotialMessageUncheckedCreateWithoutCustomerInput> | PromotialMessageCreateWithoutCustomerInput[] | PromotialMessageUncheckedCreateWithoutCustomerInput[]
    connectOrCreate?: PromotialMessageCreateOrConnectWithoutCustomerInput | PromotialMessageCreateOrConnectWithoutCustomerInput[]
    upsert?: PromotialMessageUpsertWithWhereUniqueWithoutCustomerInput | PromotialMessageUpsertWithWhereUniqueWithoutCustomerInput[]
    createMany?: PromotialMessageCreateManyCustomerInputEnvelope
    set?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    disconnect?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    delete?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    connect?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    update?: PromotialMessageUpdateWithWhereUniqueWithoutCustomerInput | PromotialMessageUpdateWithWhereUniqueWithoutCustomerInput[]
    updateMany?: PromotialMessageUpdateManyWithWhereWithoutCustomerInput | PromotialMessageUpdateManyWithWhereWithoutCustomerInput[]
    deleteMany?: PromotialMessageScalarWhereInput | PromotialMessageScalarWhereInput[]
  }

  export type DeliveryAddressUpdateManyWithoutCustomerNestedInput = {
    create?: XOR<DeliveryAddressCreateWithoutCustomerInput, DeliveryAddressUncheckedCreateWithoutCustomerInput> | DeliveryAddressCreateWithoutCustomerInput[] | DeliveryAddressUncheckedCreateWithoutCustomerInput[]
    connectOrCreate?: DeliveryAddressCreateOrConnectWithoutCustomerInput | DeliveryAddressCreateOrConnectWithoutCustomerInput[]
    upsert?: DeliveryAddressUpsertWithWhereUniqueWithoutCustomerInput | DeliveryAddressUpsertWithWhereUniqueWithoutCustomerInput[]
    createMany?: DeliveryAddressCreateManyCustomerInputEnvelope
    set?: DeliveryAddressWhereUniqueInput | DeliveryAddressWhereUniqueInput[]
    disconnect?: DeliveryAddressWhereUniqueInput | DeliveryAddressWhereUniqueInput[]
    delete?: DeliveryAddressWhereUniqueInput | DeliveryAddressWhereUniqueInput[]
    connect?: DeliveryAddressWhereUniqueInput | DeliveryAddressWhereUniqueInput[]
    update?: DeliveryAddressUpdateWithWhereUniqueWithoutCustomerInput | DeliveryAddressUpdateWithWhereUniqueWithoutCustomerInput[]
    updateMany?: DeliveryAddressUpdateManyWithWhereWithoutCustomerInput | DeliveryAddressUpdateManyWithWhereWithoutCustomerInput[]
    deleteMany?: DeliveryAddressScalarWhereInput | DeliveryAddressScalarWhereInput[]
  }

  export type OrderUncheckedUpdateManyWithoutCustomerNestedInput = {
    create?: XOR<OrderCreateWithoutCustomerInput, OrderUncheckedCreateWithoutCustomerInput> | OrderCreateWithoutCustomerInput[] | OrderUncheckedCreateWithoutCustomerInput[]
    connectOrCreate?: OrderCreateOrConnectWithoutCustomerInput | OrderCreateOrConnectWithoutCustomerInput[]
    upsert?: OrderUpsertWithWhereUniqueWithoutCustomerInput | OrderUpsertWithWhereUniqueWithoutCustomerInput[]
    createMany?: OrderCreateManyCustomerInputEnvelope
    set?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    disconnect?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    delete?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    connect?: OrderWhereUniqueInput | OrderWhereUniqueInput[]
    update?: OrderUpdateWithWhereUniqueWithoutCustomerInput | OrderUpdateWithWhereUniqueWithoutCustomerInput[]
    updateMany?: OrderUpdateManyWithWhereWithoutCustomerInput | OrderUpdateManyWithWhereWithoutCustomerInput[]
    deleteMany?: OrderScalarWhereInput | OrderScalarWhereInput[]
  }

  export type PromotialMessageUncheckedUpdateManyWithoutCustomerNestedInput = {
    create?: XOR<PromotialMessageCreateWithoutCustomerInput, PromotialMessageUncheckedCreateWithoutCustomerInput> | PromotialMessageCreateWithoutCustomerInput[] | PromotialMessageUncheckedCreateWithoutCustomerInput[]
    connectOrCreate?: PromotialMessageCreateOrConnectWithoutCustomerInput | PromotialMessageCreateOrConnectWithoutCustomerInput[]
    upsert?: PromotialMessageUpsertWithWhereUniqueWithoutCustomerInput | PromotialMessageUpsertWithWhereUniqueWithoutCustomerInput[]
    createMany?: PromotialMessageCreateManyCustomerInputEnvelope
    set?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    disconnect?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    delete?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    connect?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    update?: PromotialMessageUpdateWithWhereUniqueWithoutCustomerInput | PromotialMessageUpdateWithWhereUniqueWithoutCustomerInput[]
    updateMany?: PromotialMessageUpdateManyWithWhereWithoutCustomerInput | PromotialMessageUpdateManyWithWhereWithoutCustomerInput[]
    deleteMany?: PromotialMessageScalarWhereInput | PromotialMessageScalarWhereInput[]
  }

  export type DeliveryAddressUncheckedUpdateManyWithoutCustomerNestedInput = {
    create?: XOR<DeliveryAddressCreateWithoutCustomerInput, DeliveryAddressUncheckedCreateWithoutCustomerInput> | DeliveryAddressCreateWithoutCustomerInput[] | DeliveryAddressUncheckedCreateWithoutCustomerInput[]
    connectOrCreate?: DeliveryAddressCreateOrConnectWithoutCustomerInput | DeliveryAddressCreateOrConnectWithoutCustomerInput[]
    upsert?: DeliveryAddressUpsertWithWhereUniqueWithoutCustomerInput | DeliveryAddressUpsertWithWhereUniqueWithoutCustomerInput[]
    createMany?: DeliveryAddressCreateManyCustomerInputEnvelope
    set?: DeliveryAddressWhereUniqueInput | DeliveryAddressWhereUniqueInput[]
    disconnect?: DeliveryAddressWhereUniqueInput | DeliveryAddressWhereUniqueInput[]
    delete?: DeliveryAddressWhereUniqueInput | DeliveryAddressWhereUniqueInput[]
    connect?: DeliveryAddressWhereUniqueInput | DeliveryAddressWhereUniqueInput[]
    update?: DeliveryAddressUpdateWithWhereUniqueWithoutCustomerInput | DeliveryAddressUpdateWithWhereUniqueWithoutCustomerInput[]
    updateMany?: DeliveryAddressUpdateManyWithWhereWithoutCustomerInput | DeliveryAddressUpdateManyWithWhereWithoutCustomerInput[]
    deleteMany?: DeliveryAddressScalarWhereInput | DeliveryAddressScalarWhereInput[]
  }

  export type CustomerCreateNestedOneWithoutAddressesInput = {
    create?: XOR<CustomerCreateWithoutAddressesInput, CustomerUncheckedCreateWithoutAddressesInput>
    connectOrCreate?: CustomerCreateOrConnectWithoutAddressesInput
    connect?: CustomerWhereUniqueInput
  }

  export type CustomerUpdateOneWithoutAddressesNestedInput = {
    create?: XOR<CustomerCreateWithoutAddressesInput, CustomerUncheckedCreateWithoutAddressesInput>
    connectOrCreate?: CustomerCreateOrConnectWithoutAddressesInput
    upsert?: CustomerUpsertWithoutAddressesInput
    disconnect?: CustomerWhereInput | boolean
    delete?: CustomerWhereInput | boolean
    connect?: CustomerWhereUniqueInput
    update?: XOR<XOR<CustomerUpdateToOneWithWhereWithoutAddressesInput, CustomerUpdateWithoutAddressesInput>, CustomerUncheckedUpdateWithoutAddressesInput>
  }

  export type PromotialMessageCreateNestedManyWithoutMessageInput = {
    create?: XOR<PromotialMessageCreateWithoutMessageInput, PromotialMessageUncheckedCreateWithoutMessageInput> | PromotialMessageCreateWithoutMessageInput[] | PromotialMessageUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: PromotialMessageCreateOrConnectWithoutMessageInput | PromotialMessageCreateOrConnectWithoutMessageInput[]
    createMany?: PromotialMessageCreateManyMessageInputEnvelope
    connect?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
  }

  export type PromotialMessageUncheckedCreateNestedManyWithoutMessageInput = {
    create?: XOR<PromotialMessageCreateWithoutMessageInput, PromotialMessageUncheckedCreateWithoutMessageInput> | PromotialMessageCreateWithoutMessageInput[] | PromotialMessageUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: PromotialMessageCreateOrConnectWithoutMessageInput | PromotialMessageCreateOrConnectWithoutMessageInput[]
    createMany?: PromotialMessageCreateManyMessageInputEnvelope
    connect?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
  }

  export type PromotialMessageUpdateManyWithoutMessageNestedInput = {
    create?: XOR<PromotialMessageCreateWithoutMessageInput, PromotialMessageUncheckedCreateWithoutMessageInput> | PromotialMessageCreateWithoutMessageInput[] | PromotialMessageUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: PromotialMessageCreateOrConnectWithoutMessageInput | PromotialMessageCreateOrConnectWithoutMessageInput[]
    upsert?: PromotialMessageUpsertWithWhereUniqueWithoutMessageInput | PromotialMessageUpsertWithWhereUniqueWithoutMessageInput[]
    createMany?: PromotialMessageCreateManyMessageInputEnvelope
    set?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    disconnect?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    delete?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    connect?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    update?: PromotialMessageUpdateWithWhereUniqueWithoutMessageInput | PromotialMessageUpdateWithWhereUniqueWithoutMessageInput[]
    updateMany?: PromotialMessageUpdateManyWithWhereWithoutMessageInput | PromotialMessageUpdateManyWithWhereWithoutMessageInput[]
    deleteMany?: PromotialMessageScalarWhereInput | PromotialMessageScalarWhereInput[]
  }

  export type PromotialMessageUncheckedUpdateManyWithoutMessageNestedInput = {
    create?: XOR<PromotialMessageCreateWithoutMessageInput, PromotialMessageUncheckedCreateWithoutMessageInput> | PromotialMessageCreateWithoutMessageInput[] | PromotialMessageUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: PromotialMessageCreateOrConnectWithoutMessageInput | PromotialMessageCreateOrConnectWithoutMessageInput[]
    upsert?: PromotialMessageUpsertWithWhereUniqueWithoutMessageInput | PromotialMessageUpsertWithWhereUniqueWithoutMessageInput[]
    createMany?: PromotialMessageCreateManyMessageInputEnvelope
    set?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    disconnect?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    delete?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    connect?: PromotialMessageWhereUniqueInput | PromotialMessageWhereUniqueInput[]
    update?: PromotialMessageUpdateWithWhereUniqueWithoutMessageInput | PromotialMessageUpdateWithWhereUniqueWithoutMessageInput[]
    updateMany?: PromotialMessageUpdateManyWithWhereWithoutMessageInput | PromotialMessageUpdateManyWithWhereWithoutMessageInput[]
    deleteMany?: PromotialMessageScalarWhereInput | PromotialMessageScalarWhereInput[]
  }

  export type CampaignCreateNestedOneWithoutPromotialMessagesInput = {
    create?: XOR<CampaignCreateWithoutPromotialMessagesInput, CampaignUncheckedCreateWithoutPromotialMessagesInput>
    connectOrCreate?: CampaignCreateOrConnectWithoutPromotialMessagesInput
    connect?: CampaignWhereUniqueInput
  }

  export type MessageCreateNestedOneWithoutPromotialMessagesInput = {
    create?: XOR<MessageCreateWithoutPromotialMessagesInput, MessageUncheckedCreateWithoutPromotialMessagesInput>
    connectOrCreate?: MessageCreateOrConnectWithoutPromotialMessagesInput
    connect?: MessageWhereUniqueInput
  }

  export type CustomerCreateNestedOneWithoutPromotionalMessagesInput = {
    create?: XOR<CustomerCreateWithoutPromotionalMessagesInput, CustomerUncheckedCreateWithoutPromotionalMessagesInput>
    connectOrCreate?: CustomerCreateOrConnectWithoutPromotionalMessagesInput
    connect?: CustomerWhereUniqueInput
  }

  export type CampaignUpdateOneWithoutPromotialMessagesNestedInput = {
    create?: XOR<CampaignCreateWithoutPromotialMessagesInput, CampaignUncheckedCreateWithoutPromotialMessagesInput>
    connectOrCreate?: CampaignCreateOrConnectWithoutPromotialMessagesInput
    upsert?: CampaignUpsertWithoutPromotialMessagesInput
    disconnect?: CampaignWhereInput | boolean
    delete?: CampaignWhereInput | boolean
    connect?: CampaignWhereUniqueInput
    update?: XOR<XOR<CampaignUpdateToOneWithWhereWithoutPromotialMessagesInput, CampaignUpdateWithoutPromotialMessagesInput>, CampaignUncheckedUpdateWithoutPromotialMessagesInput>
  }

  export type MessageUpdateOneRequiredWithoutPromotialMessagesNestedInput = {
    create?: XOR<MessageCreateWithoutPromotialMessagesInput, MessageUncheckedCreateWithoutPromotialMessagesInput>
    connectOrCreate?: MessageCreateOrConnectWithoutPromotialMessagesInput
    upsert?: MessageUpsertWithoutPromotialMessagesInput
    connect?: MessageWhereUniqueInput
    update?: XOR<XOR<MessageUpdateToOneWithWhereWithoutPromotialMessagesInput, MessageUpdateWithoutPromotialMessagesInput>, MessageUncheckedUpdateWithoutPromotialMessagesInput>
  }

  export type CustomerUpdateOneRequiredWithoutPromotionalMessagesNestedInput = {
    create?: XOR<CustomerCreateWithoutPromotionalMessagesInput, CustomerUncheckedCreateWithoutPromotionalMessagesInput>
    connectOrCreate?: CustomerCreateOrConnectWithoutPromotionalMessagesInput
    upsert?: CustomerUpsertWithoutPromotionalMessagesInput
    connect?: CustomerWhereUniqueInput
    update?: XOR<XOR<CustomerUpdateToOneWithWhereWithoutPromotionalMessagesInput, CustomerUpdateWithoutPromotionalMessagesInput>, CustomerUncheckedUpdateWithoutPromotionalMessagesInput>
  }

  export type CustomerCreateNestedOneWithoutOrdersInput = {
    create?: XOR<CustomerCreateWithoutOrdersInput, CustomerUncheckedCreateWithoutOrdersInput>
    connectOrCreate?: CustomerCreateOrConnectWithoutOrdersInput
    connect?: CustomerWhereUniqueInput
  }

  export type AddressCreateNestedOneWithoutOrdersInput = {
    create?: XOR<AddressCreateWithoutOrdersInput, AddressUncheckedCreateWithoutOrdersInput>
    connectOrCreate?: AddressCreateOrConnectWithoutOrdersInput
    connect?: AddressWhereUniqueInput
  }

  export type OrderProductsCreateNestedManyWithoutOrderInput = {
    create?: XOR<OrderProductsCreateWithoutOrderInput, OrderProductsUncheckedCreateWithoutOrderInput> | OrderProductsCreateWithoutOrderInput[] | OrderProductsUncheckedCreateWithoutOrderInput[]
    connectOrCreate?: OrderProductsCreateOrConnectWithoutOrderInput | OrderProductsCreateOrConnectWithoutOrderInput[]
    createMany?: OrderProductsCreateManyOrderInputEnvelope
    connect?: OrderProductsWhereUniqueInput | OrderProductsWhereUniqueInput[]
  }

  export type OrderProductsUncheckedCreateNestedManyWithoutOrderInput = {
    create?: XOR<OrderProductsCreateWithoutOrderInput, OrderProductsUncheckedCreateWithoutOrderInput> | OrderProductsCreateWithoutOrderInput[] | OrderProductsUncheckedCreateWithoutOrderInput[]
    connectOrCreate?: OrderProductsCreateOrConnectWithoutOrderInput | OrderProductsCreateOrConnectWithoutOrderInput[]
    createMany?: OrderProductsCreateManyOrderInputEnvelope
    connect?: OrderProductsWhereUniqueInput | OrderProductsWhereUniqueInput[]
  }

  export type EnumOrderTypeFieldUpdateOperationsInput = {
    set?: $Enums.OrderType
  }

  export type EnumPaymentTypeFieldUpdateOperationsInput = {
    set?: $Enums.PaymentType
  }

  export type CustomerUpdateOneRequiredWithoutOrdersNestedInput = {
    create?: XOR<CustomerCreateWithoutOrdersInput, CustomerUncheckedCreateWithoutOrdersInput>
    connectOrCreate?: CustomerCreateOrConnectWithoutOrdersInput
    upsert?: CustomerUpsertWithoutOrdersInput
    connect?: CustomerWhereUniqueInput
    update?: XOR<XOR<CustomerUpdateToOneWithWhereWithoutOrdersInput, CustomerUpdateWithoutOrdersInput>, CustomerUncheckedUpdateWithoutOrdersInput>
  }

  export type AddressUpdateOneWithoutOrdersNestedInput = {
    create?: XOR<AddressCreateWithoutOrdersInput, AddressUncheckedCreateWithoutOrdersInput>
    connectOrCreate?: AddressCreateOrConnectWithoutOrdersInput
    upsert?: AddressUpsertWithoutOrdersInput
    disconnect?: AddressWhereInput | boolean
    delete?: AddressWhereInput | boolean
    connect?: AddressWhereUniqueInput
    update?: XOR<XOR<AddressUpdateToOneWithWhereWithoutOrdersInput, AddressUpdateWithoutOrdersInput>, AddressUncheckedUpdateWithoutOrdersInput>
  }

  export type OrderProductsUpdateManyWithoutOrderNestedInput = {
    create?: XOR<OrderProductsCreateWithoutOrderInput, OrderProductsUncheckedCreateWithoutOrderInput> | OrderProductsCreateWithoutOrderInput[] | OrderProductsUncheckedCreateWithoutOrderInput[]
    connectOrCreate?: OrderProductsCreateOrConnectWithoutOrderInput | OrderProductsCreateOrConnectWithoutOrderInput[]
    upsert?: OrderProductsUpsertWithWhereUniqueWithoutOrderInput | OrderProductsUpsertWithWhereUniqueWithoutOrderInput[]
    createMany?: OrderProductsCreateManyOrderInputEnvelope
    set?: OrderProductsWhereUniqueInput | OrderProductsWhereUniqueInput[]
    disconnect?: OrderProductsWhereUniqueInput | OrderProductsWhereUniqueInput[]
    delete?: OrderProductsWhereUniqueInput | OrderProductsWhereUniqueInput[]
    connect?: OrderProductsWhereUniqueInput | OrderProductsWhereUniqueInput[]
    update?: OrderProductsUpdateWithWhereUniqueWithoutOrderInput | OrderProductsUpdateWithWhereUniqueWithoutOrderInput[]
    updateMany?: OrderProductsUpdateManyWithWhereWithoutOrderInput | OrderProductsUpdateManyWithWhereWithoutOrderInput[]
    deleteMany?: OrderProductsScalarWhereInput | OrderProductsScalarWhereInput[]
  }

  export type OrderProductsUncheckedUpdateManyWithoutOrderNestedInput = {
    create?: XOR<OrderProductsCreateWithoutOrderInput, OrderProductsUncheckedCreateWithoutOrderInput> | OrderProductsCreateWithoutOrderInput[] | OrderProductsUncheckedCreateWithoutOrderInput[]
    connectOrCreate?: OrderProductsCreateOrConnectWithoutOrderInput | OrderProductsCreateOrConnectWithoutOrderInput[]
    upsert?: OrderProductsUpsertWithWhereUniqueWithoutOrderInput | OrderProductsUpsertWithWhereUniqueWithoutOrderInput[]
    createMany?: OrderProductsCreateManyOrderInputEnvelope
    set?: OrderProductsWhereUniqueInput | OrderProductsWhereUniqueInput[]
    disconnect?: OrderProductsWhereUniqueInput | OrderProductsWhereUniqueInput[]
    delete?: OrderProductsWhereUniqueInput | OrderProductsWhereUniqueInput[]
    connect?: OrderProductsWhereUniqueInput | OrderProductsWhereUniqueInput[]
    update?: OrderProductsUpdateWithWhereUniqueWithoutOrderInput | OrderProductsUpdateWithWhereUniqueWithoutOrderInput[]
    updateMany?: OrderProductsUpdateManyWithWhereWithoutOrderInput | OrderProductsUpdateManyWithWhereWithoutOrderInput[]
    deleteMany?: OrderProductsScalarWhereInput | OrderProductsScalarWhereInput[]
  }

  export type ProductCreateNestedOneWithoutOrderProductsInput = {
    create?: XOR<ProductCreateWithoutOrderProductsInput, ProductUncheckedCreateWithoutOrderProductsInput>
    connectOrCreate?: ProductCreateOrConnectWithoutOrderProductsInput
    connect?: ProductWhereUniqueInput
  }

  export type OrderCreateNestedOneWithoutOrderProductsInput = {
    create?: XOR<OrderCreateWithoutOrderProductsInput, OrderUncheckedCreateWithoutOrderProductsInput>
    connectOrCreate?: OrderCreateOrConnectWithoutOrderProductsInput
    connect?: OrderWhereUniqueInput
  }

  export type ProductUpdateOneRequiredWithoutOrderProductsNestedInput = {
    create?: XOR<ProductCreateWithoutOrderProductsInput, ProductUncheckedCreateWithoutOrderProductsInput>
    connectOrCreate?: ProductCreateOrConnectWithoutOrderProductsInput
    upsert?: ProductUpsertWithoutOrderProductsInput
    connect?: ProductWhereUniqueInput
    update?: XOR<XOR<ProductUpdateToOneWithWhereWithoutOrderProductsInput, ProductUpdateWithoutOrderProductsInput>, ProductUncheckedUpdateWithoutOrderProductsInput>
  }

  export type OrderUpdateOneWithoutOrderProductsNestedInput = {
    create?: XOR<OrderCreateWithoutOrderProductsInput, OrderUncheckedCreateWithoutOrderProductsInput>
    connectOrCreate?: OrderCreateOrConnectWithoutOrderProductsInput
    upsert?: OrderUpsertWithoutOrderProductsInput
    disconnect?: OrderWhereInput | boolean
    delete?: OrderWhereInput | boolean
    connect?: OrderWhereUniqueInput
    update?: XOR<XOR<OrderUpdateToOneWithWhereWithoutOrderProductsInput, OrderUpdateWithoutOrderProductsInput>, OrderUncheckedUpdateWithoutOrderProductsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumProgressiveDiscountStepTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ProgressiveDiscountStepType | EnumProgressiveDiscountStepTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProgressiveDiscountStepType[] | ListEnumProgressiveDiscountStepTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProgressiveDiscountStepType[] | ListEnumProgressiveDiscountStepTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProgressiveDiscountStepTypeFilter<$PrismaModel> | $Enums.ProgressiveDiscountStepType
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumProgressiveDiscountStepTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProgressiveDiscountStepType | EnumProgressiveDiscountStepTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProgressiveDiscountStepType[] | ListEnumProgressiveDiscountStepTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProgressiveDiscountStepType[] | ListEnumProgressiveDiscountStepTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProgressiveDiscountStepTypeWithAggregatesFilter<$PrismaModel> | $Enums.ProgressiveDiscountStepType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProgressiveDiscountStepTypeFilter<$PrismaModel>
    _max?: NestedEnumProgressiveDiscountStepTypeFilter<$PrismaModel>
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedEnumModifierGroupTypeNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.ModifierGroupType | EnumModifierGroupTypeFieldRefInput<$PrismaModel> | null
    in?: $Enums.ModifierGroupType[] | ListEnumModifierGroupTypeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.ModifierGroupType[] | ListEnumModifierGroupTypeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumModifierGroupTypeNullableFilter<$PrismaModel> | $Enums.ModifierGroupType | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumModifierGroupTypeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ModifierGroupType | EnumModifierGroupTypeFieldRefInput<$PrismaModel> | null
    in?: $Enums.ModifierGroupType[] | ListEnumModifierGroupTypeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.ModifierGroupType[] | ListEnumModifierGroupTypeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumModifierGroupTypeNullableWithAggregatesFilter<$PrismaModel> | $Enums.ModifierGroupType | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumModifierGroupTypeNullableFilter<$PrismaModel>
    _max?: NestedEnumModifierGroupTypeNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedEnumOrderTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.OrderType | EnumOrderTypeFieldRefInput<$PrismaModel>
    in?: $Enums.OrderType[] | ListEnumOrderTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.OrderType[] | ListEnumOrderTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumOrderTypeFilter<$PrismaModel> | $Enums.OrderType
  }

  export type NestedEnumPaymentTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentType | EnumPaymentTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentType[] | ListEnumPaymentTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentType[] | ListEnumPaymentTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentTypeFilter<$PrismaModel> | $Enums.PaymentType
  }

  export type NestedEnumOrderTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.OrderType | EnumOrderTypeFieldRefInput<$PrismaModel>
    in?: $Enums.OrderType[] | ListEnumOrderTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.OrderType[] | ListEnumOrderTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumOrderTypeWithAggregatesFilter<$PrismaModel> | $Enums.OrderType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumOrderTypeFilter<$PrismaModel>
    _max?: NestedEnumOrderTypeFilter<$PrismaModel>
  }

  export type NestedEnumPaymentTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentType | EnumPaymentTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentType[] | ListEnumPaymentTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentType[] | ListEnumPaymentTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentTypeWithAggregatesFilter<$PrismaModel> | $Enums.PaymentType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentTypeFilter<$PrismaModel>
    _max?: NestedEnumPaymentTypeFilter<$PrismaModel>
  }

  export type ProgressiveDiscountStepCreateWithoutProgressiveDiscountInput = {
    id: string
    createdAt?: Date | string
    amount: number
    discount?: number | null
    discountType: $Enums.ProgressiveDiscountStepType
  }

  export type ProgressiveDiscountStepUncheckedCreateWithoutProgressiveDiscountInput = {
    id: string
    createdAt?: Date | string
    amount: number
    discount?: number | null
    discountType: $Enums.ProgressiveDiscountStepType
  }

  export type ProgressiveDiscountStepCreateOrConnectWithoutProgressiveDiscountInput = {
    where: ProgressiveDiscountStepWhereUniqueInput
    create: XOR<ProgressiveDiscountStepCreateWithoutProgressiveDiscountInput, ProgressiveDiscountStepUncheckedCreateWithoutProgressiveDiscountInput>
  }

  export type ProgressiveDiscountStepCreateManyProgressiveDiscountInputEnvelope = {
    data: ProgressiveDiscountStepCreateManyProgressiveDiscountInput | ProgressiveDiscountStepCreateManyProgressiveDiscountInput[]
    skipDuplicates?: boolean
  }

  export type ProgressiveDiscountStepUpsertWithWhereUniqueWithoutProgressiveDiscountInput = {
    where: ProgressiveDiscountStepWhereUniqueInput
    update: XOR<ProgressiveDiscountStepUpdateWithoutProgressiveDiscountInput, ProgressiveDiscountStepUncheckedUpdateWithoutProgressiveDiscountInput>
    create: XOR<ProgressiveDiscountStepCreateWithoutProgressiveDiscountInput, ProgressiveDiscountStepUncheckedCreateWithoutProgressiveDiscountInput>
  }

  export type ProgressiveDiscountStepUpdateWithWhereUniqueWithoutProgressiveDiscountInput = {
    where: ProgressiveDiscountStepWhereUniqueInput
    data: XOR<ProgressiveDiscountStepUpdateWithoutProgressiveDiscountInput, ProgressiveDiscountStepUncheckedUpdateWithoutProgressiveDiscountInput>
  }

  export type ProgressiveDiscountStepUpdateManyWithWhereWithoutProgressiveDiscountInput = {
    where: ProgressiveDiscountStepScalarWhereInput
    data: XOR<ProgressiveDiscountStepUpdateManyMutationInput, ProgressiveDiscountStepUncheckedUpdateManyWithoutProgressiveDiscountInput>
  }

  export type ProgressiveDiscountStepScalarWhereInput = {
    AND?: ProgressiveDiscountStepScalarWhereInput | ProgressiveDiscountStepScalarWhereInput[]
    OR?: ProgressiveDiscountStepScalarWhereInput[]
    NOT?: ProgressiveDiscountStepScalarWhereInput | ProgressiveDiscountStepScalarWhereInput[]
    id?: StringFilter<"ProgressiveDiscountStep"> | string
    createdAt?: DateTimeFilter<"ProgressiveDiscountStep"> | Date | string
    amount?: IntFilter<"ProgressiveDiscountStep"> | number
    discount?: IntNullableFilter<"ProgressiveDiscountStep"> | number | null
    discountType?: EnumProgressiveDiscountStepTypeFilter<"ProgressiveDiscountStep"> | $Enums.ProgressiveDiscountStepType
    progressiveDiscountId?: StringFilter<"ProgressiveDiscountStep"> | string
  }

  export type ProgressiveDiscountCreateWithoutStepsInput = {
    id: string
    createdAt?: Date | string
  }

  export type ProgressiveDiscountUncheckedCreateWithoutStepsInput = {
    id: string
    createdAt?: Date | string
  }

  export type ProgressiveDiscountCreateOrConnectWithoutStepsInput = {
    where: ProgressiveDiscountWhereUniqueInput
    create: XOR<ProgressiveDiscountCreateWithoutStepsInput, ProgressiveDiscountUncheckedCreateWithoutStepsInput>
  }

  export type ProgressiveDiscountUpsertWithoutStepsInput = {
    update: XOR<ProgressiveDiscountUpdateWithoutStepsInput, ProgressiveDiscountUncheckedUpdateWithoutStepsInput>
    create: XOR<ProgressiveDiscountCreateWithoutStepsInput, ProgressiveDiscountUncheckedCreateWithoutStepsInput>
    where?: ProgressiveDiscountWhereInput
  }

  export type ProgressiveDiscountUpdateToOneWithWhereWithoutStepsInput = {
    where?: ProgressiveDiscountWhereInput
    data: XOR<ProgressiveDiscountUpdateWithoutStepsInput, ProgressiveDiscountUncheckedUpdateWithoutStepsInput>
  }

  export type ProgressiveDiscountUpdateWithoutStepsInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProgressiveDiscountUncheckedUpdateWithoutStepsInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProductCreateWithoutPhotosInput = {
    id: string
    createdAt?: Date | string
    name: string
    description?: string | null
    price?: number | null
    comparedAtPrice?: number | null
    modifierGroups?: ModifierGroupCreateNestedManyWithoutProductInput
    category?: CategoryCreateNestedOneWithoutProductsInput
    OrderProducts?: OrderProductsCreateNestedManyWithoutProductInput
  }

  export type ProductUncheckedCreateWithoutPhotosInput = {
    id: string
    createdAt?: Date | string
    name: string
    description?: string | null
    price?: number | null
    comparedAtPrice?: number | null
    categoryId?: string | null
    modifierGroups?: ModifierGroupUncheckedCreateNestedManyWithoutProductInput
    OrderProducts?: OrderProductsUncheckedCreateNestedManyWithoutProductInput
  }

  export type ProductCreateOrConnectWithoutPhotosInput = {
    where: ProductWhereUniqueInput
    create: XOR<ProductCreateWithoutPhotosInput, ProductUncheckedCreateWithoutPhotosInput>
  }

  export type ProductUpsertWithoutPhotosInput = {
    update: XOR<ProductUpdateWithoutPhotosInput, ProductUncheckedUpdateWithoutPhotosInput>
    create: XOR<ProductCreateWithoutPhotosInput, ProductUncheckedCreateWithoutPhotosInput>
    where?: ProductWhereInput
  }

  export type ProductUpdateToOneWithWhereWithoutPhotosInput = {
    where?: ProductWhereInput
    data: XOR<ProductUpdateWithoutPhotosInput, ProductUncheckedUpdateWithoutPhotosInput>
  }

  export type ProductUpdateWithoutPhotosInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    price?: NullableIntFieldUpdateOperationsInput | number | null
    comparedAtPrice?: NullableIntFieldUpdateOperationsInput | number | null
    modifierGroups?: ModifierGroupUpdateManyWithoutProductNestedInput
    category?: CategoryUpdateOneWithoutProductsNestedInput
    OrderProducts?: OrderProductsUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateWithoutPhotosInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    price?: NullableIntFieldUpdateOperationsInput | number | null
    comparedAtPrice?: NullableIntFieldUpdateOperationsInput | number | null
    categoryId?: NullableStringFieldUpdateOperationsInput | string | null
    modifierGroups?: ModifierGroupUncheckedUpdateManyWithoutProductNestedInput
    OrderProducts?: OrderProductsUncheckedUpdateManyWithoutProductNestedInput
  }

  export type ProductCreateWithoutModifierGroupsInput = {
    id: string
    createdAt?: Date | string
    name: string
    description?: string | null
    price?: number | null
    comparedAtPrice?: number | null
    photos?: FileCreateNestedManyWithoutProductInput
    category?: CategoryCreateNestedOneWithoutProductsInput
    OrderProducts?: OrderProductsCreateNestedManyWithoutProductInput
  }

  export type ProductUncheckedCreateWithoutModifierGroupsInput = {
    id: string
    createdAt?: Date | string
    name: string
    description?: string | null
    price?: number | null
    comparedAtPrice?: number | null
    categoryId?: string | null
    photos?: FileUncheckedCreateNestedManyWithoutProductInput
    OrderProducts?: OrderProductsUncheckedCreateNestedManyWithoutProductInput
  }

  export type ProductCreateOrConnectWithoutModifierGroupsInput = {
    where: ProductWhereUniqueInput
    create: XOR<ProductCreateWithoutModifierGroupsInput, ProductUncheckedCreateWithoutModifierGroupsInput>
  }

  export type ProductUpsertWithoutModifierGroupsInput = {
    update: XOR<ProductUpdateWithoutModifierGroupsInput, ProductUncheckedUpdateWithoutModifierGroupsInput>
    create: XOR<ProductCreateWithoutModifierGroupsInput, ProductUncheckedCreateWithoutModifierGroupsInput>
    where?: ProductWhereInput
  }

  export type ProductUpdateToOneWithWhereWithoutModifierGroupsInput = {
    where?: ProductWhereInput
    data: XOR<ProductUpdateWithoutModifierGroupsInput, ProductUncheckedUpdateWithoutModifierGroupsInput>
  }

  export type ProductUpdateWithoutModifierGroupsInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    price?: NullableIntFieldUpdateOperationsInput | number | null
    comparedAtPrice?: NullableIntFieldUpdateOperationsInput | number | null
    photos?: FileUpdateManyWithoutProductNestedInput
    category?: CategoryUpdateOneWithoutProductsNestedInput
    OrderProducts?: OrderProductsUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateWithoutModifierGroupsInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    price?: NullableIntFieldUpdateOperationsInput | number | null
    comparedAtPrice?: NullableIntFieldUpdateOperationsInput | number | null
    categoryId?: NullableStringFieldUpdateOperationsInput | string | null
    photos?: FileUncheckedUpdateManyWithoutProductNestedInput
    OrderProducts?: OrderProductsUncheckedUpdateManyWithoutProductNestedInput
  }

  export type BranchCreateWithoutBusinessInput = {
    id: string
    createdAt?: Date | string
    name: string
    address?: AddressCreateNestedOneWithoutBranchInput
  }

  export type BranchUncheckedCreateWithoutBusinessInput = {
    id: string
    createdAt?: Date | string
    name: string
    addressId?: string | null
  }

  export type BranchCreateOrConnectWithoutBusinessInput = {
    where: BranchWhereUniqueInput
    create: XOR<BranchCreateWithoutBusinessInput, BranchUncheckedCreateWithoutBusinessInput>
  }

  export type BranchCreateManyBusinessInputEnvelope = {
    data: BranchCreateManyBusinessInput | BranchCreateManyBusinessInput[]
    skipDuplicates?: boolean
  }

  export type BranchUpsertWithWhereUniqueWithoutBusinessInput = {
    where: BranchWhereUniqueInput
    update: XOR<BranchUpdateWithoutBusinessInput, BranchUncheckedUpdateWithoutBusinessInput>
    create: XOR<BranchCreateWithoutBusinessInput, BranchUncheckedCreateWithoutBusinessInput>
  }

  export type BranchUpdateWithWhereUniqueWithoutBusinessInput = {
    where: BranchWhereUniqueInput
    data: XOR<BranchUpdateWithoutBusinessInput, BranchUncheckedUpdateWithoutBusinessInput>
  }

  export type BranchUpdateManyWithWhereWithoutBusinessInput = {
    where: BranchScalarWhereInput
    data: XOR<BranchUpdateManyMutationInput, BranchUncheckedUpdateManyWithoutBusinessInput>
  }

  export type BranchScalarWhereInput = {
    AND?: BranchScalarWhereInput | BranchScalarWhereInput[]
    OR?: BranchScalarWhereInput[]
    NOT?: BranchScalarWhereInput | BranchScalarWhereInput[]
    id?: StringFilter<"Branch"> | string
    createdAt?: DateTimeFilter<"Branch"> | Date | string
    name?: StringFilter<"Branch"> | string
    addressId?: StringNullableFilter<"Branch"> | string | null
    businessId?: StringNullableFilter<"Branch"> | string | null
  }

  export type AddressCreateWithoutBranchInput = {
    id: string
    createdAt?: Date | string
    description: string
    googleMapsUrl: string
    orders?: OrderCreateNestedManyWithoutAddressInput
  }

  export type AddressUncheckedCreateWithoutBranchInput = {
    id: string
    createdAt?: Date | string
    description: string
    googleMapsUrl: string
    orders?: OrderUncheckedCreateNestedManyWithoutAddressInput
  }

  export type AddressCreateOrConnectWithoutBranchInput = {
    where: AddressWhereUniqueInput
    create: XOR<AddressCreateWithoutBranchInput, AddressUncheckedCreateWithoutBranchInput>
  }

  export type BusinessCreateWithoutBranchesInput = {
    id: string
    createdAt?: Date | string
    name: string
  }

  export type BusinessUncheckedCreateWithoutBranchesInput = {
    id: string
    createdAt?: Date | string
    name: string
  }

  export type BusinessCreateOrConnectWithoutBranchesInput = {
    where: BusinessWhereUniqueInput
    create: XOR<BusinessCreateWithoutBranchesInput, BusinessUncheckedCreateWithoutBranchesInput>
  }

  export type AddressUpsertWithoutBranchInput = {
    update: XOR<AddressUpdateWithoutBranchInput, AddressUncheckedUpdateWithoutBranchInput>
    create: XOR<AddressCreateWithoutBranchInput, AddressUncheckedCreateWithoutBranchInput>
    where?: AddressWhereInput
  }

  export type AddressUpdateToOneWithWhereWithoutBranchInput = {
    where?: AddressWhereInput
    data: XOR<AddressUpdateWithoutBranchInput, AddressUncheckedUpdateWithoutBranchInput>
  }

  export type AddressUpdateWithoutBranchInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    description?: StringFieldUpdateOperationsInput | string
    googleMapsUrl?: StringFieldUpdateOperationsInput | string
    orders?: OrderUpdateManyWithoutAddressNestedInput
  }

  export type AddressUncheckedUpdateWithoutBranchInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    description?: StringFieldUpdateOperationsInput | string
    googleMapsUrl?: StringFieldUpdateOperationsInput | string
    orders?: OrderUncheckedUpdateManyWithoutAddressNestedInput
  }

  export type BusinessUpsertWithoutBranchesInput = {
    update: XOR<BusinessUpdateWithoutBranchesInput, BusinessUncheckedUpdateWithoutBranchesInput>
    create: XOR<BusinessCreateWithoutBranchesInput, BusinessUncheckedCreateWithoutBranchesInput>
    where?: BusinessWhereInput
  }

  export type BusinessUpdateToOneWithWhereWithoutBranchesInput = {
    where?: BusinessWhereInput
    data: XOR<BusinessUpdateWithoutBranchesInput, BusinessUncheckedUpdateWithoutBranchesInput>
  }

  export type BusinessUpdateWithoutBranchesInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type BusinessUncheckedUpdateWithoutBranchesInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type BranchCreateWithoutAddressInput = {
    id: string
    createdAt?: Date | string
    name: string
    business?: BusinessCreateNestedOneWithoutBranchesInput
  }

  export type BranchUncheckedCreateWithoutAddressInput = {
    id: string
    createdAt?: Date | string
    name: string
    businessId?: string | null
  }

  export type BranchCreateOrConnectWithoutAddressInput = {
    where: BranchWhereUniqueInput
    create: XOR<BranchCreateWithoutAddressInput, BranchUncheckedCreateWithoutAddressInput>
  }

  export type OrderCreateWithoutAddressInput = {
    id: string
    createdAt?: Date | string
    amount: number
    type?: $Enums.OrderType
    paymentMethod?: $Enums.PaymentType
    tipAmount?: number | null
    externalId?: string | null
    customer: CustomerCreateNestedOneWithoutOrdersInput
    orderProducts?: OrderProductsCreateNestedManyWithoutOrderInput
  }

  export type OrderUncheckedCreateWithoutAddressInput = {
    id: string
    createdAt?: Date | string
    amount: number
    type?: $Enums.OrderType
    paymentMethod?: $Enums.PaymentType
    tipAmount?: number | null
    customerId: string
    externalId?: string | null
    orderProducts?: OrderProductsUncheckedCreateNestedManyWithoutOrderInput
  }

  export type OrderCreateOrConnectWithoutAddressInput = {
    where: OrderWhereUniqueInput
    create: XOR<OrderCreateWithoutAddressInput, OrderUncheckedCreateWithoutAddressInput>
  }

  export type OrderCreateManyAddressInputEnvelope = {
    data: OrderCreateManyAddressInput | OrderCreateManyAddressInput[]
    skipDuplicates?: boolean
  }

  export type BranchUpsertWithoutAddressInput = {
    update: XOR<BranchUpdateWithoutAddressInput, BranchUncheckedUpdateWithoutAddressInput>
    create: XOR<BranchCreateWithoutAddressInput, BranchUncheckedCreateWithoutAddressInput>
    where?: BranchWhereInput
  }

  export type BranchUpdateToOneWithWhereWithoutAddressInput = {
    where?: BranchWhereInput
    data: XOR<BranchUpdateWithoutAddressInput, BranchUncheckedUpdateWithoutAddressInput>
  }

  export type BranchUpdateWithoutAddressInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    business?: BusinessUpdateOneWithoutBranchesNestedInput
  }

  export type BranchUncheckedUpdateWithoutAddressInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    businessId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type OrderUpsertWithWhereUniqueWithoutAddressInput = {
    where: OrderWhereUniqueInput
    update: XOR<OrderUpdateWithoutAddressInput, OrderUncheckedUpdateWithoutAddressInput>
    create: XOR<OrderCreateWithoutAddressInput, OrderUncheckedCreateWithoutAddressInput>
  }

  export type OrderUpdateWithWhereUniqueWithoutAddressInput = {
    where: OrderWhereUniqueInput
    data: XOR<OrderUpdateWithoutAddressInput, OrderUncheckedUpdateWithoutAddressInput>
  }

  export type OrderUpdateManyWithWhereWithoutAddressInput = {
    where: OrderScalarWhereInput
    data: XOR<OrderUpdateManyMutationInput, OrderUncheckedUpdateManyWithoutAddressInput>
  }

  export type OrderScalarWhereInput = {
    AND?: OrderScalarWhereInput | OrderScalarWhereInput[]
    OR?: OrderScalarWhereInput[]
    NOT?: OrderScalarWhereInput | OrderScalarWhereInput[]
    id?: StringFilter<"Order"> | string
    createdAt?: DateTimeFilter<"Order"> | Date | string
    amount?: IntFilter<"Order"> | number
    type?: EnumOrderTypeFilter<"Order"> | $Enums.OrderType
    paymentMethod?: EnumPaymentTypeFilter<"Order"> | $Enums.PaymentType
    tipAmount?: IntNullableFilter<"Order"> | number | null
    customerId?: StringFilter<"Order"> | string
    externalId?: StringNullableFilter<"Order"> | string | null
    addressId?: StringNullableFilter<"Order"> | string | null
  }

  export type FileCreateWithoutProductInput = {
    id: string
    createdAt?: Date | string
    name: string
    url: string
    size: number
  }

  export type FileUncheckedCreateWithoutProductInput = {
    id: string
    createdAt?: Date | string
    name: string
    url: string
    size: number
  }

  export type FileCreateOrConnectWithoutProductInput = {
    where: FileWhereUniqueInput
    create: XOR<FileCreateWithoutProductInput, FileUncheckedCreateWithoutProductInput>
  }

  export type FileCreateManyProductInputEnvelope = {
    data: FileCreateManyProductInput | FileCreateManyProductInput[]
    skipDuplicates?: boolean
  }

  export type ModifierGroupCreateWithoutProductInput = {
    id: string
    createdAt?: Date | string
    title: string
    required?: boolean
    type?: $Enums.ModifierGroupType | null
    minSelection?: number | null
    maxSelection?: number | null
  }

  export type ModifierGroupUncheckedCreateWithoutProductInput = {
    id: string
    createdAt?: Date | string
    title: string
    required?: boolean
    type?: $Enums.ModifierGroupType | null
    minSelection?: number | null
    maxSelection?: number | null
  }

  export type ModifierGroupCreateOrConnectWithoutProductInput = {
    where: ModifierGroupWhereUniqueInput
    create: XOR<ModifierGroupCreateWithoutProductInput, ModifierGroupUncheckedCreateWithoutProductInput>
  }

  export type ModifierGroupCreateManyProductInputEnvelope = {
    data: ModifierGroupCreateManyProductInput | ModifierGroupCreateManyProductInput[]
    skipDuplicates?: boolean
  }

  export type CategoryCreateWithoutProductsInput = {
    id: string
    createdAt?: Date | string
    name: string
  }

  export type CategoryUncheckedCreateWithoutProductsInput = {
    id: string
    createdAt?: Date | string
    name: string
  }

  export type CategoryCreateOrConnectWithoutProductsInput = {
    where: CategoryWhereUniqueInput
    create: XOR<CategoryCreateWithoutProductsInput, CategoryUncheckedCreateWithoutProductsInput>
  }

  export type OrderProductsCreateWithoutProductInput = {
    id: string
    createdAt?: Date | string
    quantity: number
    fullAmount: number
    amount: number
    order?: OrderCreateNestedOneWithoutOrderProductsInput
  }

  export type OrderProductsUncheckedCreateWithoutProductInput = {
    id: string
    createdAt?: Date | string
    quantity: number
    fullAmount: number
    amount: number
    orderId?: string | null
  }

  export type OrderProductsCreateOrConnectWithoutProductInput = {
    where: OrderProductsWhereUniqueInput
    create: XOR<OrderProductsCreateWithoutProductInput, OrderProductsUncheckedCreateWithoutProductInput>
  }

  export type OrderProductsCreateManyProductInputEnvelope = {
    data: OrderProductsCreateManyProductInput | OrderProductsCreateManyProductInput[]
    skipDuplicates?: boolean
  }

  export type FileUpsertWithWhereUniqueWithoutProductInput = {
    where: FileWhereUniqueInput
    update: XOR<FileUpdateWithoutProductInput, FileUncheckedUpdateWithoutProductInput>
    create: XOR<FileCreateWithoutProductInput, FileUncheckedCreateWithoutProductInput>
  }

  export type FileUpdateWithWhereUniqueWithoutProductInput = {
    where: FileWhereUniqueInput
    data: XOR<FileUpdateWithoutProductInput, FileUncheckedUpdateWithoutProductInput>
  }

  export type FileUpdateManyWithWhereWithoutProductInput = {
    where: FileScalarWhereInput
    data: XOR<FileUpdateManyMutationInput, FileUncheckedUpdateManyWithoutProductInput>
  }

  export type FileScalarWhereInput = {
    AND?: FileScalarWhereInput | FileScalarWhereInput[]
    OR?: FileScalarWhereInput[]
    NOT?: FileScalarWhereInput | FileScalarWhereInput[]
    id?: StringFilter<"File"> | string
    createdAt?: DateTimeFilter<"File"> | Date | string
    name?: StringFilter<"File"> | string
    url?: StringFilter<"File"> | string
    size?: IntFilter<"File"> | number
    productId?: StringNullableFilter<"File"> | string | null
  }

  export type ModifierGroupUpsertWithWhereUniqueWithoutProductInput = {
    where: ModifierGroupWhereUniqueInput
    update: XOR<ModifierGroupUpdateWithoutProductInput, ModifierGroupUncheckedUpdateWithoutProductInput>
    create: XOR<ModifierGroupCreateWithoutProductInput, ModifierGroupUncheckedCreateWithoutProductInput>
  }

  export type ModifierGroupUpdateWithWhereUniqueWithoutProductInput = {
    where: ModifierGroupWhereUniqueInput
    data: XOR<ModifierGroupUpdateWithoutProductInput, ModifierGroupUncheckedUpdateWithoutProductInput>
  }

  export type ModifierGroupUpdateManyWithWhereWithoutProductInput = {
    where: ModifierGroupScalarWhereInput
    data: XOR<ModifierGroupUpdateManyMutationInput, ModifierGroupUncheckedUpdateManyWithoutProductInput>
  }

  export type ModifierGroupScalarWhereInput = {
    AND?: ModifierGroupScalarWhereInput | ModifierGroupScalarWhereInput[]
    OR?: ModifierGroupScalarWhereInput[]
    NOT?: ModifierGroupScalarWhereInput | ModifierGroupScalarWhereInput[]
    id?: StringFilter<"ModifierGroup"> | string
    createdAt?: DateTimeFilter<"ModifierGroup"> | Date | string
    title?: StringFilter<"ModifierGroup"> | string
    required?: BoolFilter<"ModifierGroup"> | boolean
    type?: EnumModifierGroupTypeNullableFilter<"ModifierGroup"> | $Enums.ModifierGroupType | null
    productId?: StringNullableFilter<"ModifierGroup"> | string | null
    minSelection?: IntNullableFilter<"ModifierGroup"> | number | null
    maxSelection?: IntNullableFilter<"ModifierGroup"> | number | null
  }

  export type CategoryUpsertWithoutProductsInput = {
    update: XOR<CategoryUpdateWithoutProductsInput, CategoryUncheckedUpdateWithoutProductsInput>
    create: XOR<CategoryCreateWithoutProductsInput, CategoryUncheckedCreateWithoutProductsInput>
    where?: CategoryWhereInput
  }

  export type CategoryUpdateToOneWithWhereWithoutProductsInput = {
    where?: CategoryWhereInput
    data: XOR<CategoryUpdateWithoutProductsInput, CategoryUncheckedUpdateWithoutProductsInput>
  }

  export type CategoryUpdateWithoutProductsInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type CategoryUncheckedUpdateWithoutProductsInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type OrderProductsUpsertWithWhereUniqueWithoutProductInput = {
    where: OrderProductsWhereUniqueInput
    update: XOR<OrderProductsUpdateWithoutProductInput, OrderProductsUncheckedUpdateWithoutProductInput>
    create: XOR<OrderProductsCreateWithoutProductInput, OrderProductsUncheckedCreateWithoutProductInput>
  }

  export type OrderProductsUpdateWithWhereUniqueWithoutProductInput = {
    where: OrderProductsWhereUniqueInput
    data: XOR<OrderProductsUpdateWithoutProductInput, OrderProductsUncheckedUpdateWithoutProductInput>
  }

  export type OrderProductsUpdateManyWithWhereWithoutProductInput = {
    where: OrderProductsScalarWhereInput
    data: XOR<OrderProductsUpdateManyMutationInput, OrderProductsUncheckedUpdateManyWithoutProductInput>
  }

  export type OrderProductsScalarWhereInput = {
    AND?: OrderProductsScalarWhereInput | OrderProductsScalarWhereInput[]
    OR?: OrderProductsScalarWhereInput[]
    NOT?: OrderProductsScalarWhereInput | OrderProductsScalarWhereInput[]
    id?: StringFilter<"OrderProducts"> | string
    createdAt?: DateTimeFilter<"OrderProducts"> | Date | string
    productId?: StringFilter<"OrderProducts"> | string
    quantity?: IntFilter<"OrderProducts"> | number
    fullAmount?: IntFilter<"OrderProducts"> | number
    amount?: IntFilter<"OrderProducts"> | number
    orderId?: StringNullableFilter<"OrderProducts"> | string | null
  }

  export type ProductCreateWithoutCategoryInput = {
    id: string
    createdAt?: Date | string
    name: string
    description?: string | null
    price?: number | null
    comparedAtPrice?: number | null
    photos?: FileCreateNestedManyWithoutProductInput
    modifierGroups?: ModifierGroupCreateNestedManyWithoutProductInput
    OrderProducts?: OrderProductsCreateNestedManyWithoutProductInput
  }

  export type ProductUncheckedCreateWithoutCategoryInput = {
    id: string
    createdAt?: Date | string
    name: string
    description?: string | null
    price?: number | null
    comparedAtPrice?: number | null
    photos?: FileUncheckedCreateNestedManyWithoutProductInput
    modifierGroups?: ModifierGroupUncheckedCreateNestedManyWithoutProductInput
    OrderProducts?: OrderProductsUncheckedCreateNestedManyWithoutProductInput
  }

  export type ProductCreateOrConnectWithoutCategoryInput = {
    where: ProductWhereUniqueInput
    create: XOR<ProductCreateWithoutCategoryInput, ProductUncheckedCreateWithoutCategoryInput>
  }

  export type ProductCreateManyCategoryInputEnvelope = {
    data: ProductCreateManyCategoryInput | ProductCreateManyCategoryInput[]
    skipDuplicates?: boolean
  }

  export type ProductUpsertWithWhereUniqueWithoutCategoryInput = {
    where: ProductWhereUniqueInput
    update: XOR<ProductUpdateWithoutCategoryInput, ProductUncheckedUpdateWithoutCategoryInput>
    create: XOR<ProductCreateWithoutCategoryInput, ProductUncheckedCreateWithoutCategoryInput>
  }

  export type ProductUpdateWithWhereUniqueWithoutCategoryInput = {
    where: ProductWhereUniqueInput
    data: XOR<ProductUpdateWithoutCategoryInput, ProductUncheckedUpdateWithoutCategoryInput>
  }

  export type ProductUpdateManyWithWhereWithoutCategoryInput = {
    where: ProductScalarWhereInput
    data: XOR<ProductUpdateManyMutationInput, ProductUncheckedUpdateManyWithoutCategoryInput>
  }

  export type ProductScalarWhereInput = {
    AND?: ProductScalarWhereInput | ProductScalarWhereInput[]
    OR?: ProductScalarWhereInput[]
    NOT?: ProductScalarWhereInput | ProductScalarWhereInput[]
    id?: StringFilter<"Product"> | string
    createdAt?: DateTimeFilter<"Product"> | Date | string
    name?: StringFilter<"Product"> | string
    description?: StringNullableFilter<"Product"> | string | null
    price?: IntNullableFilter<"Product"> | number | null
    comparedAtPrice?: IntNullableFilter<"Product"> | number | null
    categoryId?: StringNullableFilter<"Product"> | string | null
  }

  export type PromotialMessageCreateWithoutCampaignInput = {
    id: string
    sentAt?: Date | string
    message: MessageCreateNestedOneWithoutPromotialMessagesInput
    Customer: CustomerCreateNestedOneWithoutPromotionalMessagesInput
  }

  export type PromotialMessageUncheckedCreateWithoutCampaignInput = {
    id: string
    sentAt?: Date | string
    messageId: string
    customerId: string
  }

  export type PromotialMessageCreateOrConnectWithoutCampaignInput = {
    where: PromotialMessageWhereUniqueInput
    create: XOR<PromotialMessageCreateWithoutCampaignInput, PromotialMessageUncheckedCreateWithoutCampaignInput>
  }

  export type PromotialMessageCreateManyCampaignInputEnvelope = {
    data: PromotialMessageCreateManyCampaignInput | PromotialMessageCreateManyCampaignInput[]
    skipDuplicates?: boolean
  }

  export type PromotialMessageUpsertWithWhereUniqueWithoutCampaignInput = {
    where: PromotialMessageWhereUniqueInput
    update: XOR<PromotialMessageUpdateWithoutCampaignInput, PromotialMessageUncheckedUpdateWithoutCampaignInput>
    create: XOR<PromotialMessageCreateWithoutCampaignInput, PromotialMessageUncheckedCreateWithoutCampaignInput>
  }

  export type PromotialMessageUpdateWithWhereUniqueWithoutCampaignInput = {
    where: PromotialMessageWhereUniqueInput
    data: XOR<PromotialMessageUpdateWithoutCampaignInput, PromotialMessageUncheckedUpdateWithoutCampaignInput>
  }

  export type PromotialMessageUpdateManyWithWhereWithoutCampaignInput = {
    where: PromotialMessageScalarWhereInput
    data: XOR<PromotialMessageUpdateManyMutationInput, PromotialMessageUncheckedUpdateManyWithoutCampaignInput>
  }

  export type PromotialMessageScalarWhereInput = {
    AND?: PromotialMessageScalarWhereInput | PromotialMessageScalarWhereInput[]
    OR?: PromotialMessageScalarWhereInput[]
    NOT?: PromotialMessageScalarWhereInput | PromotialMessageScalarWhereInput[]
    id?: StringFilter<"PromotialMessage"> | string
    sentAt?: DateTimeFilter<"PromotialMessage"> | Date | string
    campaignId?: StringNullableFilter<"PromotialMessage"> | string | null
    messageId?: StringFilter<"PromotialMessage"> | string
    customerId?: StringFilter<"PromotialMessage"> | string
  }

  export type OrderCreateWithoutCustomerInput = {
    id: string
    createdAt?: Date | string
    amount: number
    type?: $Enums.OrderType
    paymentMethod?: $Enums.PaymentType
    tipAmount?: number | null
    externalId?: string | null
    address?: AddressCreateNestedOneWithoutOrdersInput
    orderProducts?: OrderProductsCreateNestedManyWithoutOrderInput
  }

  export type OrderUncheckedCreateWithoutCustomerInput = {
    id: string
    createdAt?: Date | string
    amount: number
    type?: $Enums.OrderType
    paymentMethod?: $Enums.PaymentType
    tipAmount?: number | null
    externalId?: string | null
    addressId?: string | null
    orderProducts?: OrderProductsUncheckedCreateNestedManyWithoutOrderInput
  }

  export type OrderCreateOrConnectWithoutCustomerInput = {
    where: OrderWhereUniqueInput
    create: XOR<OrderCreateWithoutCustomerInput, OrderUncheckedCreateWithoutCustomerInput>
  }

  export type OrderCreateManyCustomerInputEnvelope = {
    data: OrderCreateManyCustomerInput | OrderCreateManyCustomerInput[]
    skipDuplicates?: boolean
  }

  export type PromotialMessageCreateWithoutCustomerInput = {
    id: string
    sentAt?: Date | string
    Campaign?: CampaignCreateNestedOneWithoutPromotialMessagesInput
    message: MessageCreateNestedOneWithoutPromotialMessagesInput
  }

  export type PromotialMessageUncheckedCreateWithoutCustomerInput = {
    id: string
    sentAt?: Date | string
    campaignId?: string | null
    messageId: string
  }

  export type PromotialMessageCreateOrConnectWithoutCustomerInput = {
    where: PromotialMessageWhereUniqueInput
    create: XOR<PromotialMessageCreateWithoutCustomerInput, PromotialMessageUncheckedCreateWithoutCustomerInput>
  }

  export type PromotialMessageCreateManyCustomerInputEnvelope = {
    data: PromotialMessageCreateManyCustomerInput | PromotialMessageCreateManyCustomerInput[]
    skipDuplicates?: boolean
  }

  export type DeliveryAddressCreateWithoutCustomerInput = {
    id: string
    createdAt?: Date | string
    lat: string
    lng: string
    city: string
    zipCode: string
    State: string
    street: string
    number: string
    description: string
    complement?: string | null
    numberComplement?: string | null
  }

  export type DeliveryAddressUncheckedCreateWithoutCustomerInput = {
    id: string
    createdAt?: Date | string
    lat: string
    lng: string
    city: string
    zipCode: string
    State: string
    street: string
    number: string
    description: string
    complement?: string | null
    numberComplement?: string | null
  }

  export type DeliveryAddressCreateOrConnectWithoutCustomerInput = {
    where: DeliveryAddressWhereUniqueInput
    create: XOR<DeliveryAddressCreateWithoutCustomerInput, DeliveryAddressUncheckedCreateWithoutCustomerInput>
  }

  export type DeliveryAddressCreateManyCustomerInputEnvelope = {
    data: DeliveryAddressCreateManyCustomerInput | DeliveryAddressCreateManyCustomerInput[]
    skipDuplicates?: boolean
  }

  export type OrderUpsertWithWhereUniqueWithoutCustomerInput = {
    where: OrderWhereUniqueInput
    update: XOR<OrderUpdateWithoutCustomerInput, OrderUncheckedUpdateWithoutCustomerInput>
    create: XOR<OrderCreateWithoutCustomerInput, OrderUncheckedCreateWithoutCustomerInput>
  }

  export type OrderUpdateWithWhereUniqueWithoutCustomerInput = {
    where: OrderWhereUniqueInput
    data: XOR<OrderUpdateWithoutCustomerInput, OrderUncheckedUpdateWithoutCustomerInput>
  }

  export type OrderUpdateManyWithWhereWithoutCustomerInput = {
    where: OrderScalarWhereInput
    data: XOR<OrderUpdateManyMutationInput, OrderUncheckedUpdateManyWithoutCustomerInput>
  }

  export type PromotialMessageUpsertWithWhereUniqueWithoutCustomerInput = {
    where: PromotialMessageWhereUniqueInput
    update: XOR<PromotialMessageUpdateWithoutCustomerInput, PromotialMessageUncheckedUpdateWithoutCustomerInput>
    create: XOR<PromotialMessageCreateWithoutCustomerInput, PromotialMessageUncheckedCreateWithoutCustomerInput>
  }

  export type PromotialMessageUpdateWithWhereUniqueWithoutCustomerInput = {
    where: PromotialMessageWhereUniqueInput
    data: XOR<PromotialMessageUpdateWithoutCustomerInput, PromotialMessageUncheckedUpdateWithoutCustomerInput>
  }

  export type PromotialMessageUpdateManyWithWhereWithoutCustomerInput = {
    where: PromotialMessageScalarWhereInput
    data: XOR<PromotialMessageUpdateManyMutationInput, PromotialMessageUncheckedUpdateManyWithoutCustomerInput>
  }

  export type DeliveryAddressUpsertWithWhereUniqueWithoutCustomerInput = {
    where: DeliveryAddressWhereUniqueInput
    update: XOR<DeliveryAddressUpdateWithoutCustomerInput, DeliveryAddressUncheckedUpdateWithoutCustomerInput>
    create: XOR<DeliveryAddressCreateWithoutCustomerInput, DeliveryAddressUncheckedCreateWithoutCustomerInput>
  }

  export type DeliveryAddressUpdateWithWhereUniqueWithoutCustomerInput = {
    where: DeliveryAddressWhereUniqueInput
    data: XOR<DeliveryAddressUpdateWithoutCustomerInput, DeliveryAddressUncheckedUpdateWithoutCustomerInput>
  }

  export type DeliveryAddressUpdateManyWithWhereWithoutCustomerInput = {
    where: DeliveryAddressScalarWhereInput
    data: XOR<DeliveryAddressUpdateManyMutationInput, DeliveryAddressUncheckedUpdateManyWithoutCustomerInput>
  }

  export type DeliveryAddressScalarWhereInput = {
    AND?: DeliveryAddressScalarWhereInput | DeliveryAddressScalarWhereInput[]
    OR?: DeliveryAddressScalarWhereInput[]
    NOT?: DeliveryAddressScalarWhereInput | DeliveryAddressScalarWhereInput[]
    id?: StringFilter<"DeliveryAddress"> | string
    createdAt?: DateTimeFilter<"DeliveryAddress"> | Date | string
    lat?: StringFilter<"DeliveryAddress"> | string
    lng?: StringFilter<"DeliveryAddress"> | string
    city?: StringFilter<"DeliveryAddress"> | string
    zipCode?: StringFilter<"DeliveryAddress"> | string
    State?: StringFilter<"DeliveryAddress"> | string
    street?: StringFilter<"DeliveryAddress"> | string
    number?: StringFilter<"DeliveryAddress"> | string
    description?: StringFilter<"DeliveryAddress"> | string
    complement?: StringNullableFilter<"DeliveryAddress"> | string | null
    numberComplement?: StringNullableFilter<"DeliveryAddress"> | string | null
    customerId?: StringNullableFilter<"DeliveryAddress"> | string | null
  }

  export type CustomerCreateWithoutAddressesInput = {
    id: string
    createdAt?: Date | string
    name?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    lastMessageSent?: Date | string | null
    orders?: OrderCreateNestedManyWithoutCustomerInput
    promotionalMessages?: PromotialMessageCreateNestedManyWithoutCustomerInput
  }

  export type CustomerUncheckedCreateWithoutAddressesInput = {
    id: string
    createdAt?: Date | string
    name?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    lastMessageSent?: Date | string | null
    orders?: OrderUncheckedCreateNestedManyWithoutCustomerInput
    promotionalMessages?: PromotialMessageUncheckedCreateNestedManyWithoutCustomerInput
  }

  export type CustomerCreateOrConnectWithoutAddressesInput = {
    where: CustomerWhereUniqueInput
    create: XOR<CustomerCreateWithoutAddressesInput, CustomerUncheckedCreateWithoutAddressesInput>
  }

  export type CustomerUpsertWithoutAddressesInput = {
    update: XOR<CustomerUpdateWithoutAddressesInput, CustomerUncheckedUpdateWithoutAddressesInput>
    create: XOR<CustomerCreateWithoutAddressesInput, CustomerUncheckedCreateWithoutAddressesInput>
    where?: CustomerWhereInput
  }

  export type CustomerUpdateToOneWithWhereWithoutAddressesInput = {
    where?: CustomerWhereInput
    data: XOR<CustomerUpdateWithoutAddressesInput, CustomerUncheckedUpdateWithoutAddressesInput>
  }

  export type CustomerUpdateWithoutAddressesInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    lastMessageSent?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    orders?: OrderUpdateManyWithoutCustomerNestedInput
    promotionalMessages?: PromotialMessageUpdateManyWithoutCustomerNestedInput
  }

  export type CustomerUncheckedUpdateWithoutAddressesInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    lastMessageSent?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    orders?: OrderUncheckedUpdateManyWithoutCustomerNestedInput
    promotionalMessages?: PromotialMessageUncheckedUpdateManyWithoutCustomerNestedInput
  }

  export type PromotialMessageCreateWithoutMessageInput = {
    id: string
    sentAt?: Date | string
    Campaign?: CampaignCreateNestedOneWithoutPromotialMessagesInput
    Customer: CustomerCreateNestedOneWithoutPromotionalMessagesInput
  }

  export type PromotialMessageUncheckedCreateWithoutMessageInput = {
    id: string
    sentAt?: Date | string
    campaignId?: string | null
    customerId: string
  }

  export type PromotialMessageCreateOrConnectWithoutMessageInput = {
    where: PromotialMessageWhereUniqueInput
    create: XOR<PromotialMessageCreateWithoutMessageInput, PromotialMessageUncheckedCreateWithoutMessageInput>
  }

  export type PromotialMessageCreateManyMessageInputEnvelope = {
    data: PromotialMessageCreateManyMessageInput | PromotialMessageCreateManyMessageInput[]
    skipDuplicates?: boolean
  }

  export type PromotialMessageUpsertWithWhereUniqueWithoutMessageInput = {
    where: PromotialMessageWhereUniqueInput
    update: XOR<PromotialMessageUpdateWithoutMessageInput, PromotialMessageUncheckedUpdateWithoutMessageInput>
    create: XOR<PromotialMessageCreateWithoutMessageInput, PromotialMessageUncheckedCreateWithoutMessageInput>
  }

  export type PromotialMessageUpdateWithWhereUniqueWithoutMessageInput = {
    where: PromotialMessageWhereUniqueInput
    data: XOR<PromotialMessageUpdateWithoutMessageInput, PromotialMessageUncheckedUpdateWithoutMessageInput>
  }

  export type PromotialMessageUpdateManyWithWhereWithoutMessageInput = {
    where: PromotialMessageScalarWhereInput
    data: XOR<PromotialMessageUpdateManyMutationInput, PromotialMessageUncheckedUpdateManyWithoutMessageInput>
  }

  export type CampaignCreateWithoutPromotialMessagesInput = {
    id: string
    createdAt?: Date | string
    startedAt?: Date | string | null
  }

  export type CampaignUncheckedCreateWithoutPromotialMessagesInput = {
    id: string
    createdAt?: Date | string
    startedAt?: Date | string | null
  }

  export type CampaignCreateOrConnectWithoutPromotialMessagesInput = {
    where: CampaignWhereUniqueInput
    create: XOR<CampaignCreateWithoutPromotialMessagesInput, CampaignUncheckedCreateWithoutPromotialMessagesInput>
  }

  export type MessageCreateWithoutPromotialMessagesInput = {
    id: string
    createdAt?: Date | string
    name: string
    content: string
    media?: string | null
  }

  export type MessageUncheckedCreateWithoutPromotialMessagesInput = {
    id: string
    createdAt?: Date | string
    name: string
    content: string
    media?: string | null
  }

  export type MessageCreateOrConnectWithoutPromotialMessagesInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutPromotialMessagesInput, MessageUncheckedCreateWithoutPromotialMessagesInput>
  }

  export type CustomerCreateWithoutPromotionalMessagesInput = {
    id: string
    createdAt?: Date | string
    name?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    lastMessageSent?: Date | string | null
    orders?: OrderCreateNestedManyWithoutCustomerInput
    addresses?: DeliveryAddressCreateNestedManyWithoutCustomerInput
  }

  export type CustomerUncheckedCreateWithoutPromotionalMessagesInput = {
    id: string
    createdAt?: Date | string
    name?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    lastMessageSent?: Date | string | null
    orders?: OrderUncheckedCreateNestedManyWithoutCustomerInput
    addresses?: DeliveryAddressUncheckedCreateNestedManyWithoutCustomerInput
  }

  export type CustomerCreateOrConnectWithoutPromotionalMessagesInput = {
    where: CustomerWhereUniqueInput
    create: XOR<CustomerCreateWithoutPromotionalMessagesInput, CustomerUncheckedCreateWithoutPromotionalMessagesInput>
  }

  export type CampaignUpsertWithoutPromotialMessagesInput = {
    update: XOR<CampaignUpdateWithoutPromotialMessagesInput, CampaignUncheckedUpdateWithoutPromotialMessagesInput>
    create: XOR<CampaignCreateWithoutPromotialMessagesInput, CampaignUncheckedCreateWithoutPromotialMessagesInput>
    where?: CampaignWhereInput
  }

  export type CampaignUpdateToOneWithWhereWithoutPromotialMessagesInput = {
    where?: CampaignWhereInput
    data: XOR<CampaignUpdateWithoutPromotialMessagesInput, CampaignUncheckedUpdateWithoutPromotialMessagesInput>
  }

  export type CampaignUpdateWithoutPromotialMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type CampaignUncheckedUpdateWithoutPromotialMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MessageUpsertWithoutPromotialMessagesInput = {
    update: XOR<MessageUpdateWithoutPromotialMessagesInput, MessageUncheckedUpdateWithoutPromotialMessagesInput>
    create: XOR<MessageCreateWithoutPromotialMessagesInput, MessageUncheckedCreateWithoutPromotialMessagesInput>
    where?: MessageWhereInput
  }

  export type MessageUpdateToOneWithWhereWithoutPromotialMessagesInput = {
    where?: MessageWhereInput
    data: XOR<MessageUpdateWithoutPromotialMessagesInput, MessageUncheckedUpdateWithoutPromotialMessagesInput>
  }

  export type MessageUpdateWithoutPromotialMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    media?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type MessageUncheckedUpdateWithoutPromotialMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    media?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type CustomerUpsertWithoutPromotionalMessagesInput = {
    update: XOR<CustomerUpdateWithoutPromotionalMessagesInput, CustomerUncheckedUpdateWithoutPromotionalMessagesInput>
    create: XOR<CustomerCreateWithoutPromotionalMessagesInput, CustomerUncheckedCreateWithoutPromotionalMessagesInput>
    where?: CustomerWhereInput
  }

  export type CustomerUpdateToOneWithWhereWithoutPromotionalMessagesInput = {
    where?: CustomerWhereInput
    data: XOR<CustomerUpdateWithoutPromotionalMessagesInput, CustomerUncheckedUpdateWithoutPromotionalMessagesInput>
  }

  export type CustomerUpdateWithoutPromotionalMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    lastMessageSent?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    orders?: OrderUpdateManyWithoutCustomerNestedInput
    addresses?: DeliveryAddressUpdateManyWithoutCustomerNestedInput
  }

  export type CustomerUncheckedUpdateWithoutPromotionalMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    lastMessageSent?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    orders?: OrderUncheckedUpdateManyWithoutCustomerNestedInput
    addresses?: DeliveryAddressUncheckedUpdateManyWithoutCustomerNestedInput
  }

  export type CustomerCreateWithoutOrdersInput = {
    id: string
    createdAt?: Date | string
    name?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    lastMessageSent?: Date | string | null
    promotionalMessages?: PromotialMessageCreateNestedManyWithoutCustomerInput
    addresses?: DeliveryAddressCreateNestedManyWithoutCustomerInput
  }

  export type CustomerUncheckedCreateWithoutOrdersInput = {
    id: string
    createdAt?: Date | string
    name?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    lastMessageSent?: Date | string | null
    promotionalMessages?: PromotialMessageUncheckedCreateNestedManyWithoutCustomerInput
    addresses?: DeliveryAddressUncheckedCreateNestedManyWithoutCustomerInput
  }

  export type CustomerCreateOrConnectWithoutOrdersInput = {
    where: CustomerWhereUniqueInput
    create: XOR<CustomerCreateWithoutOrdersInput, CustomerUncheckedCreateWithoutOrdersInput>
  }

  export type AddressCreateWithoutOrdersInput = {
    id: string
    createdAt?: Date | string
    description: string
    googleMapsUrl: string
    branch?: BranchCreateNestedOneWithoutAddressInput
  }

  export type AddressUncheckedCreateWithoutOrdersInput = {
    id: string
    createdAt?: Date | string
    description: string
    googleMapsUrl: string
    branch?: BranchUncheckedCreateNestedOneWithoutAddressInput
  }

  export type AddressCreateOrConnectWithoutOrdersInput = {
    where: AddressWhereUniqueInput
    create: XOR<AddressCreateWithoutOrdersInput, AddressUncheckedCreateWithoutOrdersInput>
  }

  export type OrderProductsCreateWithoutOrderInput = {
    id: string
    createdAt?: Date | string
    quantity: number
    fullAmount: number
    amount: number
    product: ProductCreateNestedOneWithoutOrderProductsInput
  }

  export type OrderProductsUncheckedCreateWithoutOrderInput = {
    id: string
    createdAt?: Date | string
    productId: string
    quantity: number
    fullAmount: number
    amount: number
  }

  export type OrderProductsCreateOrConnectWithoutOrderInput = {
    where: OrderProductsWhereUniqueInput
    create: XOR<OrderProductsCreateWithoutOrderInput, OrderProductsUncheckedCreateWithoutOrderInput>
  }

  export type OrderProductsCreateManyOrderInputEnvelope = {
    data: OrderProductsCreateManyOrderInput | OrderProductsCreateManyOrderInput[]
    skipDuplicates?: boolean
  }

  export type CustomerUpsertWithoutOrdersInput = {
    update: XOR<CustomerUpdateWithoutOrdersInput, CustomerUncheckedUpdateWithoutOrdersInput>
    create: XOR<CustomerCreateWithoutOrdersInput, CustomerUncheckedCreateWithoutOrdersInput>
    where?: CustomerWhereInput
  }

  export type CustomerUpdateToOneWithWhereWithoutOrdersInput = {
    where?: CustomerWhereInput
    data: XOR<CustomerUpdateWithoutOrdersInput, CustomerUncheckedUpdateWithoutOrdersInput>
  }

  export type CustomerUpdateWithoutOrdersInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    lastMessageSent?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    promotionalMessages?: PromotialMessageUpdateManyWithoutCustomerNestedInput
    addresses?: DeliveryAddressUpdateManyWithoutCustomerNestedInput
  }

  export type CustomerUncheckedUpdateWithoutOrdersInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    lastMessageSent?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    promotionalMessages?: PromotialMessageUncheckedUpdateManyWithoutCustomerNestedInput
    addresses?: DeliveryAddressUncheckedUpdateManyWithoutCustomerNestedInput
  }

  export type AddressUpsertWithoutOrdersInput = {
    update: XOR<AddressUpdateWithoutOrdersInput, AddressUncheckedUpdateWithoutOrdersInput>
    create: XOR<AddressCreateWithoutOrdersInput, AddressUncheckedCreateWithoutOrdersInput>
    where?: AddressWhereInput
  }

  export type AddressUpdateToOneWithWhereWithoutOrdersInput = {
    where?: AddressWhereInput
    data: XOR<AddressUpdateWithoutOrdersInput, AddressUncheckedUpdateWithoutOrdersInput>
  }

  export type AddressUpdateWithoutOrdersInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    description?: StringFieldUpdateOperationsInput | string
    googleMapsUrl?: StringFieldUpdateOperationsInput | string
    branch?: BranchUpdateOneWithoutAddressNestedInput
  }

  export type AddressUncheckedUpdateWithoutOrdersInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    description?: StringFieldUpdateOperationsInput | string
    googleMapsUrl?: StringFieldUpdateOperationsInput | string
    branch?: BranchUncheckedUpdateOneWithoutAddressNestedInput
  }

  export type OrderProductsUpsertWithWhereUniqueWithoutOrderInput = {
    where: OrderProductsWhereUniqueInput
    update: XOR<OrderProductsUpdateWithoutOrderInput, OrderProductsUncheckedUpdateWithoutOrderInput>
    create: XOR<OrderProductsCreateWithoutOrderInput, OrderProductsUncheckedCreateWithoutOrderInput>
  }

  export type OrderProductsUpdateWithWhereUniqueWithoutOrderInput = {
    where: OrderProductsWhereUniqueInput
    data: XOR<OrderProductsUpdateWithoutOrderInput, OrderProductsUncheckedUpdateWithoutOrderInput>
  }

  export type OrderProductsUpdateManyWithWhereWithoutOrderInput = {
    where: OrderProductsScalarWhereInput
    data: XOR<OrderProductsUpdateManyMutationInput, OrderProductsUncheckedUpdateManyWithoutOrderInput>
  }

  export type ProductCreateWithoutOrderProductsInput = {
    id: string
    createdAt?: Date | string
    name: string
    description?: string | null
    price?: number | null
    comparedAtPrice?: number | null
    photos?: FileCreateNestedManyWithoutProductInput
    modifierGroups?: ModifierGroupCreateNestedManyWithoutProductInput
    category?: CategoryCreateNestedOneWithoutProductsInput
  }

  export type ProductUncheckedCreateWithoutOrderProductsInput = {
    id: string
    createdAt?: Date | string
    name: string
    description?: string | null
    price?: number | null
    comparedAtPrice?: number | null
    categoryId?: string | null
    photos?: FileUncheckedCreateNestedManyWithoutProductInput
    modifierGroups?: ModifierGroupUncheckedCreateNestedManyWithoutProductInput
  }

  export type ProductCreateOrConnectWithoutOrderProductsInput = {
    where: ProductWhereUniqueInput
    create: XOR<ProductCreateWithoutOrderProductsInput, ProductUncheckedCreateWithoutOrderProductsInput>
  }

  export type OrderCreateWithoutOrderProductsInput = {
    id: string
    createdAt?: Date | string
    amount: number
    type?: $Enums.OrderType
    paymentMethod?: $Enums.PaymentType
    tipAmount?: number | null
    externalId?: string | null
    customer: CustomerCreateNestedOneWithoutOrdersInput
    address?: AddressCreateNestedOneWithoutOrdersInput
  }

  export type OrderUncheckedCreateWithoutOrderProductsInput = {
    id: string
    createdAt?: Date | string
    amount: number
    type?: $Enums.OrderType
    paymentMethod?: $Enums.PaymentType
    tipAmount?: number | null
    customerId: string
    externalId?: string | null
    addressId?: string | null
  }

  export type OrderCreateOrConnectWithoutOrderProductsInput = {
    where: OrderWhereUniqueInput
    create: XOR<OrderCreateWithoutOrderProductsInput, OrderUncheckedCreateWithoutOrderProductsInput>
  }

  export type ProductUpsertWithoutOrderProductsInput = {
    update: XOR<ProductUpdateWithoutOrderProductsInput, ProductUncheckedUpdateWithoutOrderProductsInput>
    create: XOR<ProductCreateWithoutOrderProductsInput, ProductUncheckedCreateWithoutOrderProductsInput>
    where?: ProductWhereInput
  }

  export type ProductUpdateToOneWithWhereWithoutOrderProductsInput = {
    where?: ProductWhereInput
    data: XOR<ProductUpdateWithoutOrderProductsInput, ProductUncheckedUpdateWithoutOrderProductsInput>
  }

  export type ProductUpdateWithoutOrderProductsInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    price?: NullableIntFieldUpdateOperationsInput | number | null
    comparedAtPrice?: NullableIntFieldUpdateOperationsInput | number | null
    photos?: FileUpdateManyWithoutProductNestedInput
    modifierGroups?: ModifierGroupUpdateManyWithoutProductNestedInput
    category?: CategoryUpdateOneWithoutProductsNestedInput
  }

  export type ProductUncheckedUpdateWithoutOrderProductsInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    price?: NullableIntFieldUpdateOperationsInput | number | null
    comparedAtPrice?: NullableIntFieldUpdateOperationsInput | number | null
    categoryId?: NullableStringFieldUpdateOperationsInput | string | null
    photos?: FileUncheckedUpdateManyWithoutProductNestedInput
    modifierGroups?: ModifierGroupUncheckedUpdateManyWithoutProductNestedInput
  }

  export type OrderUpsertWithoutOrderProductsInput = {
    update: XOR<OrderUpdateWithoutOrderProductsInput, OrderUncheckedUpdateWithoutOrderProductsInput>
    create: XOR<OrderCreateWithoutOrderProductsInput, OrderUncheckedCreateWithoutOrderProductsInput>
    where?: OrderWhereInput
  }

  export type OrderUpdateToOneWithWhereWithoutOrderProductsInput = {
    where?: OrderWhereInput
    data: XOR<OrderUpdateWithoutOrderProductsInput, OrderUncheckedUpdateWithoutOrderProductsInput>
  }

  export type OrderUpdateWithoutOrderProductsInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    amount?: IntFieldUpdateOperationsInput | number
    type?: EnumOrderTypeFieldUpdateOperationsInput | $Enums.OrderType
    paymentMethod?: EnumPaymentTypeFieldUpdateOperationsInput | $Enums.PaymentType
    tipAmount?: NullableIntFieldUpdateOperationsInput | number | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    customer?: CustomerUpdateOneRequiredWithoutOrdersNestedInput
    address?: AddressUpdateOneWithoutOrdersNestedInput
  }

  export type OrderUncheckedUpdateWithoutOrderProductsInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    amount?: IntFieldUpdateOperationsInput | number
    type?: EnumOrderTypeFieldUpdateOperationsInput | $Enums.OrderType
    paymentMethod?: EnumPaymentTypeFieldUpdateOperationsInput | $Enums.PaymentType
    tipAmount?: NullableIntFieldUpdateOperationsInput | number | null
    customerId?: StringFieldUpdateOperationsInput | string
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    addressId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ProgressiveDiscountStepCreateManyProgressiveDiscountInput = {
    id: string
    createdAt?: Date | string
    amount: number
    discount?: number | null
    discountType: $Enums.ProgressiveDiscountStepType
  }

  export type ProgressiveDiscountStepUpdateWithoutProgressiveDiscountInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    amount?: IntFieldUpdateOperationsInput | number
    discount?: NullableIntFieldUpdateOperationsInput | number | null
    discountType?: EnumProgressiveDiscountStepTypeFieldUpdateOperationsInput | $Enums.ProgressiveDiscountStepType
  }

  export type ProgressiveDiscountStepUncheckedUpdateWithoutProgressiveDiscountInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    amount?: IntFieldUpdateOperationsInput | number
    discount?: NullableIntFieldUpdateOperationsInput | number | null
    discountType?: EnumProgressiveDiscountStepTypeFieldUpdateOperationsInput | $Enums.ProgressiveDiscountStepType
  }

  export type ProgressiveDiscountStepUncheckedUpdateManyWithoutProgressiveDiscountInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    amount?: IntFieldUpdateOperationsInput | number
    discount?: NullableIntFieldUpdateOperationsInput | number | null
    discountType?: EnumProgressiveDiscountStepTypeFieldUpdateOperationsInput | $Enums.ProgressiveDiscountStepType
  }

  export type BranchCreateManyBusinessInput = {
    id: string
    createdAt?: Date | string
    name: string
    addressId?: string | null
  }

  export type BranchUpdateWithoutBusinessInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    address?: AddressUpdateOneWithoutBranchNestedInput
  }

  export type BranchUncheckedUpdateWithoutBusinessInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    addressId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type BranchUncheckedUpdateManyWithoutBusinessInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    addressId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type OrderCreateManyAddressInput = {
    id: string
    createdAt?: Date | string
    amount: number
    type?: $Enums.OrderType
    paymentMethod?: $Enums.PaymentType
    tipAmount?: number | null
    customerId: string
    externalId?: string | null
  }

  export type OrderUpdateWithoutAddressInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    amount?: IntFieldUpdateOperationsInput | number
    type?: EnumOrderTypeFieldUpdateOperationsInput | $Enums.OrderType
    paymentMethod?: EnumPaymentTypeFieldUpdateOperationsInput | $Enums.PaymentType
    tipAmount?: NullableIntFieldUpdateOperationsInput | number | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    customer?: CustomerUpdateOneRequiredWithoutOrdersNestedInput
    orderProducts?: OrderProductsUpdateManyWithoutOrderNestedInput
  }

  export type OrderUncheckedUpdateWithoutAddressInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    amount?: IntFieldUpdateOperationsInput | number
    type?: EnumOrderTypeFieldUpdateOperationsInput | $Enums.OrderType
    paymentMethod?: EnumPaymentTypeFieldUpdateOperationsInput | $Enums.PaymentType
    tipAmount?: NullableIntFieldUpdateOperationsInput | number | null
    customerId?: StringFieldUpdateOperationsInput | string
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    orderProducts?: OrderProductsUncheckedUpdateManyWithoutOrderNestedInput
  }

  export type OrderUncheckedUpdateManyWithoutAddressInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    amount?: IntFieldUpdateOperationsInput | number
    type?: EnumOrderTypeFieldUpdateOperationsInput | $Enums.OrderType
    paymentMethod?: EnumPaymentTypeFieldUpdateOperationsInput | $Enums.PaymentType
    tipAmount?: NullableIntFieldUpdateOperationsInput | number | null
    customerId?: StringFieldUpdateOperationsInput | string
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type FileCreateManyProductInput = {
    id: string
    createdAt?: Date | string
    name: string
    url: string
    size: number
  }

  export type ModifierGroupCreateManyProductInput = {
    id: string
    createdAt?: Date | string
    title: string
    required?: boolean
    type?: $Enums.ModifierGroupType | null
    minSelection?: number | null
    maxSelection?: number | null
  }

  export type OrderProductsCreateManyProductInput = {
    id: string
    createdAt?: Date | string
    quantity: number
    fullAmount: number
    amount: number
    orderId?: string | null
  }

  export type FileUpdateWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    size?: IntFieldUpdateOperationsInput | number
  }

  export type FileUncheckedUpdateWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    size?: IntFieldUpdateOperationsInput | number
  }

  export type FileUncheckedUpdateManyWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    size?: IntFieldUpdateOperationsInput | number
  }

  export type ModifierGroupUpdateWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: StringFieldUpdateOperationsInput | string
    required?: BoolFieldUpdateOperationsInput | boolean
    type?: NullableEnumModifierGroupTypeFieldUpdateOperationsInput | $Enums.ModifierGroupType | null
    minSelection?: NullableIntFieldUpdateOperationsInput | number | null
    maxSelection?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type ModifierGroupUncheckedUpdateWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: StringFieldUpdateOperationsInput | string
    required?: BoolFieldUpdateOperationsInput | boolean
    type?: NullableEnumModifierGroupTypeFieldUpdateOperationsInput | $Enums.ModifierGroupType | null
    minSelection?: NullableIntFieldUpdateOperationsInput | number | null
    maxSelection?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type ModifierGroupUncheckedUpdateManyWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: StringFieldUpdateOperationsInput | string
    required?: BoolFieldUpdateOperationsInput | boolean
    type?: NullableEnumModifierGroupTypeFieldUpdateOperationsInput | $Enums.ModifierGroupType | null
    minSelection?: NullableIntFieldUpdateOperationsInput | number | null
    maxSelection?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type OrderProductsUpdateWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quantity?: IntFieldUpdateOperationsInput | number
    fullAmount?: IntFieldUpdateOperationsInput | number
    amount?: IntFieldUpdateOperationsInput | number
    order?: OrderUpdateOneWithoutOrderProductsNestedInput
  }

  export type OrderProductsUncheckedUpdateWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quantity?: IntFieldUpdateOperationsInput | number
    fullAmount?: IntFieldUpdateOperationsInput | number
    amount?: IntFieldUpdateOperationsInput | number
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type OrderProductsUncheckedUpdateManyWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quantity?: IntFieldUpdateOperationsInput | number
    fullAmount?: IntFieldUpdateOperationsInput | number
    amount?: IntFieldUpdateOperationsInput | number
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ProductCreateManyCategoryInput = {
    id: string
    createdAt?: Date | string
    name: string
    description?: string | null
    price?: number | null
    comparedAtPrice?: number | null
  }

  export type ProductUpdateWithoutCategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    price?: NullableIntFieldUpdateOperationsInput | number | null
    comparedAtPrice?: NullableIntFieldUpdateOperationsInput | number | null
    photos?: FileUpdateManyWithoutProductNestedInput
    modifierGroups?: ModifierGroupUpdateManyWithoutProductNestedInput
    OrderProducts?: OrderProductsUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateWithoutCategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    price?: NullableIntFieldUpdateOperationsInput | number | null
    comparedAtPrice?: NullableIntFieldUpdateOperationsInput | number | null
    photos?: FileUncheckedUpdateManyWithoutProductNestedInput
    modifierGroups?: ModifierGroupUncheckedUpdateManyWithoutProductNestedInput
    OrderProducts?: OrderProductsUncheckedUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateManyWithoutCategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    price?: NullableIntFieldUpdateOperationsInput | number | null
    comparedAtPrice?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type PromotialMessageCreateManyCampaignInput = {
    id: string
    sentAt?: Date | string
    messageId: string
    customerId: string
  }

  export type PromotialMessageUpdateWithoutCampaignInput = {
    id?: StringFieldUpdateOperationsInput | string
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
    message?: MessageUpdateOneRequiredWithoutPromotialMessagesNestedInput
    Customer?: CustomerUpdateOneRequiredWithoutPromotionalMessagesNestedInput
  }

  export type PromotialMessageUncheckedUpdateWithoutCampaignInput = {
    id?: StringFieldUpdateOperationsInput | string
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messageId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
  }

  export type PromotialMessageUncheckedUpdateManyWithoutCampaignInput = {
    id?: StringFieldUpdateOperationsInput | string
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messageId?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
  }

  export type OrderCreateManyCustomerInput = {
    id: string
    createdAt?: Date | string
    amount: number
    type?: $Enums.OrderType
    paymentMethod?: $Enums.PaymentType
    tipAmount?: number | null
    externalId?: string | null
    addressId?: string | null
  }

  export type PromotialMessageCreateManyCustomerInput = {
    id: string
    sentAt?: Date | string
    campaignId?: string | null
    messageId: string
  }

  export type DeliveryAddressCreateManyCustomerInput = {
    id: string
    createdAt?: Date | string
    lat: string
    lng: string
    city: string
    zipCode: string
    State: string
    street: string
    number: string
    description: string
    complement?: string | null
    numberComplement?: string | null
  }

  export type OrderUpdateWithoutCustomerInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    amount?: IntFieldUpdateOperationsInput | number
    type?: EnumOrderTypeFieldUpdateOperationsInput | $Enums.OrderType
    paymentMethod?: EnumPaymentTypeFieldUpdateOperationsInput | $Enums.PaymentType
    tipAmount?: NullableIntFieldUpdateOperationsInput | number | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    address?: AddressUpdateOneWithoutOrdersNestedInput
    orderProducts?: OrderProductsUpdateManyWithoutOrderNestedInput
  }

  export type OrderUncheckedUpdateWithoutCustomerInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    amount?: IntFieldUpdateOperationsInput | number
    type?: EnumOrderTypeFieldUpdateOperationsInput | $Enums.OrderType
    paymentMethod?: EnumPaymentTypeFieldUpdateOperationsInput | $Enums.PaymentType
    tipAmount?: NullableIntFieldUpdateOperationsInput | number | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    addressId?: NullableStringFieldUpdateOperationsInput | string | null
    orderProducts?: OrderProductsUncheckedUpdateManyWithoutOrderNestedInput
  }

  export type OrderUncheckedUpdateManyWithoutCustomerInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    amount?: IntFieldUpdateOperationsInput | number
    type?: EnumOrderTypeFieldUpdateOperationsInput | $Enums.OrderType
    paymentMethod?: EnumPaymentTypeFieldUpdateOperationsInput | $Enums.PaymentType
    tipAmount?: NullableIntFieldUpdateOperationsInput | number | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    addressId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PromotialMessageUpdateWithoutCustomerInput = {
    id?: StringFieldUpdateOperationsInput | string
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
    Campaign?: CampaignUpdateOneWithoutPromotialMessagesNestedInput
    message?: MessageUpdateOneRequiredWithoutPromotialMessagesNestedInput
  }

  export type PromotialMessageUncheckedUpdateWithoutCustomerInput = {
    id?: StringFieldUpdateOperationsInput | string
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
    campaignId?: NullableStringFieldUpdateOperationsInput | string | null
    messageId?: StringFieldUpdateOperationsInput | string
  }

  export type PromotialMessageUncheckedUpdateManyWithoutCustomerInput = {
    id?: StringFieldUpdateOperationsInput | string
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
    campaignId?: NullableStringFieldUpdateOperationsInput | string | null
    messageId?: StringFieldUpdateOperationsInput | string
  }

  export type DeliveryAddressUpdateWithoutCustomerInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lat?: StringFieldUpdateOperationsInput | string
    lng?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    zipCode?: StringFieldUpdateOperationsInput | string
    State?: StringFieldUpdateOperationsInput | string
    street?: StringFieldUpdateOperationsInput | string
    number?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    complement?: NullableStringFieldUpdateOperationsInput | string | null
    numberComplement?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type DeliveryAddressUncheckedUpdateWithoutCustomerInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lat?: StringFieldUpdateOperationsInput | string
    lng?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    zipCode?: StringFieldUpdateOperationsInput | string
    State?: StringFieldUpdateOperationsInput | string
    street?: StringFieldUpdateOperationsInput | string
    number?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    complement?: NullableStringFieldUpdateOperationsInput | string | null
    numberComplement?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type DeliveryAddressUncheckedUpdateManyWithoutCustomerInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lat?: StringFieldUpdateOperationsInput | string
    lng?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    zipCode?: StringFieldUpdateOperationsInput | string
    State?: StringFieldUpdateOperationsInput | string
    street?: StringFieldUpdateOperationsInput | string
    number?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    complement?: NullableStringFieldUpdateOperationsInput | string | null
    numberComplement?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PromotialMessageCreateManyMessageInput = {
    id: string
    sentAt?: Date | string
    campaignId?: string | null
    customerId: string
  }

  export type PromotialMessageUpdateWithoutMessageInput = {
    id?: StringFieldUpdateOperationsInput | string
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
    Campaign?: CampaignUpdateOneWithoutPromotialMessagesNestedInput
    Customer?: CustomerUpdateOneRequiredWithoutPromotionalMessagesNestedInput
  }

  export type PromotialMessageUncheckedUpdateWithoutMessageInput = {
    id?: StringFieldUpdateOperationsInput | string
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
    campaignId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
  }

  export type PromotialMessageUncheckedUpdateManyWithoutMessageInput = {
    id?: StringFieldUpdateOperationsInput | string
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
    campaignId?: NullableStringFieldUpdateOperationsInput | string | null
    customerId?: StringFieldUpdateOperationsInput | string
  }

  export type OrderProductsCreateManyOrderInput = {
    id: string
    createdAt?: Date | string
    productId: string
    quantity: number
    fullAmount: number
    amount: number
  }

  export type OrderProductsUpdateWithoutOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quantity?: IntFieldUpdateOperationsInput | number
    fullAmount?: IntFieldUpdateOperationsInput | number
    amount?: IntFieldUpdateOperationsInput | number
    product?: ProductUpdateOneRequiredWithoutOrderProductsNestedInput
  }

  export type OrderProductsUncheckedUpdateWithoutOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    productId?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    fullAmount?: IntFieldUpdateOperationsInput | number
    amount?: IntFieldUpdateOperationsInput | number
  }

  export type OrderProductsUncheckedUpdateManyWithoutOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    productId?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    fullAmount?: IntFieldUpdateOperationsInput | number
    amount?: IntFieldUpdateOperationsInput | number
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}