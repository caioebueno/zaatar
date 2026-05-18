import type { HttpController, HttpRequest, HttpResponse } from "../../../../shared/http/types.js";
import { createNextRequestLike } from "../../infrastructure/native/shared/http.js";
import * as productsRoute from "../../infrastructure/native/products/route.js";
import * as productIdRoute from "../../infrastructure/native/products/productIdRoute.js";
import * as categoriesRoute from "../../infrastructure/native/categories/route.js";
import * as categoryIdRoute from "../../infrastructure/native/categories/categoryIdRoute.js";
import * as menusRoute from "../../infrastructure/native/menus/route.js";
import * as menuIdRoute from "../../infrastructure/native/menus/menuIdRoute.js";
import * as modifierGroupsRoute from "../../infrastructure/native/modifier-groups/route.js";
import * as modifierGroupIdRoute from "../../infrastructure/native/modifier-groups/modifierGroupIdRoute.js";
import * as modifierGroupItemsRoute from "../../infrastructure/native/modifier-group-items/route.js";
import * as modifierGroupItemIdRoute from "../../infrastructure/native/modifier-group-items/itemIdRoute.js";
import * as bucketUploadRoute from "../../infrastructure/native/bucket/uploadRoute.js";
import * as progressiveDiscountRoute from "../../infrastructure/native/progressive-discount/route.js";
import * as posExclusivePromotionsRoute from "../../infrastructure/native/pos-exclusive-promotions/route.js";
import * as customerSearchRoute from "../../infrastructure/native/customers/searchRoute.js";
import * as customersRoute from "../../infrastructure/native/customers/route.js";
import * as addressSearchRoute from "../../infrastructure/native/address-search/route.js";

export class NativeCatalogController implements HttpController {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const parsedUrl = new URL(request.path, "http://localhost");
    const pathname = parsedUrl.pathname;
    const nextRequest = createNextRequestLike({
      body: request.body,
      formData: request.formData,
      headers: request.headers,
      nextUrl: parsedUrl,
      rawBody: request.rawBody,
    });

    if (request.method === "GET" && pathname === "/products") {
      return productsRoute.GET();
    }

    if (request.method === "POST" && pathname === "/products") {
      return productsRoute.POST(nextRequest);
    }

    if (request.method === "PATCH" && pathname.startsWith("/products/")) {
      const productId = decodeURIComponent(pathname.slice("/products/".length));
      return productIdRoute.PATCH(nextRequest, {
        params: Promise.resolve({ productId }),
      });
    }

    if (request.method === "GET" && pathname === "/categories") {
      return categoriesRoute.GET(nextRequest);
    }

    if (request.method === "POST" && pathname === "/categories") {
      return categoriesRoute.POST(nextRequest);
    }

    if (request.method === "PATCH" && pathname.startsWith("/categories/")) {
      const categoryId = decodeURIComponent(pathname.slice("/categories/".length));
      return categoryIdRoute.PATCH(nextRequest, {
        params: Promise.resolve({ categoryId }),
      });
    }

    if (request.method === "DELETE" && pathname.startsWith("/categories/")) {
      const categoryId = decodeURIComponent(pathname.slice("/categories/".length));
      return categoryIdRoute.DELETE(nextRequest, {
        params: Promise.resolve({ categoryId }),
      });
    }

    if (request.method === "GET" && pathname === "/menus") {
      return menusRoute.GET();
    }

    if (request.method === "POST" && pathname === "/menus") {
      return menusRoute.POST(nextRequest);
    }

    if (request.method === "PATCH" && pathname.startsWith("/menus/")) {
      const menuId = decodeURIComponent(pathname.slice("/menus/".length));
      return menuIdRoute.PATCH(nextRequest, {
        params: Promise.resolve({ menuId }),
      });
    }

    if (request.method === "POST" && pathname === "/modifier-groups") {
      return modifierGroupsRoute.POST(nextRequest);
    }

    if (request.method === "PATCH" && pathname.startsWith("/modifier-groups/")) {
      const modifierGroupId = decodeURIComponent(pathname.slice("/modifier-groups/".length));
      return modifierGroupIdRoute.PATCH(nextRequest, {
        params: Promise.resolve({ modifierGroupId }),
      });
    }

    if (request.method === "DELETE" && pathname.startsWith("/modifier-groups/")) {
      const modifierGroupId = decodeURIComponent(pathname.slice("/modifier-groups/".length));
      return modifierGroupIdRoute.DELETE(nextRequest, {
        params: Promise.resolve({ modifierGroupId }),
      });
    }

    if (request.method === "POST" && pathname === "/modifier-group-items") {
      return modifierGroupItemsRoute.POST(nextRequest);
    }

    if (
      request.method === "PATCH" &&
      pathname.startsWith("/modifier-group-items/")
    ) {
      const itemId = decodeURIComponent(pathname.slice("/modifier-group-items/".length));
      return modifierGroupItemIdRoute.PATCH(nextRequest, {
        params: Promise.resolve({ itemId }),
      });
    }

    if (
      request.method === "DELETE" &&
      pathname.startsWith("/modifier-group-items/")
    ) {
      const itemId = decodeURIComponent(pathname.slice("/modifier-group-items/".length));
      return modifierGroupItemIdRoute.DELETE(nextRequest, {
        params: Promise.resolve({ itemId }),
      });
    }

    if (request.method === "POST" && pathname === "/bucket/upload") {
      return bucketUploadRoute.POST(nextRequest);
    }

    if (request.method === "GET" && pathname === "/progressive-discount") {
      return progressiveDiscountRoute.GET();
    }

    if (request.method === "GET" && pathname === "/pos/exclusive-promotions") {
      return posExclusivePromotionsRoute.GET(nextRequest);
    }

    if (request.method === "GET" && pathname === "/customers/search") {
      return customerSearchRoute.GET(nextRequest);
    }

    if (request.method === "POST" && pathname === "/customers") {
      return customersRoute.POST(nextRequest);
    }

    if (request.method === "GET" && pathname === "/address-search") {
      return addressSearchRoute.GET(nextRequest);
    }

    return {
      statusCode: 404,
      body: { error: "Not found" },
    };
  }
}
