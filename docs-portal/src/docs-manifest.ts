import overviewMd from '../../api/docs/README.md?raw'
import entitiesMd from '../../api/docs/entities.md?raw'
import entityOrderMd from '../../api/docs/entities/order.md?raw'
import entityOrderPaymentMd from '../../api/docs/entities/order-payment.md?raw'
import entityOrderIntentMd from '../../api/docs/entities/order-intent.md?raw'
import entityCustomerMd from '../../api/docs/entities/customer.md?raw'
import entityDispatchMd from '../../api/docs/entities/dispatch.md?raw'
import entityDriverMd from '../../api/docs/entities/driver.md?raw'
import entityBusinessMd from '../../api/docs/entities/business.md?raw'
import entityBranchMd from '../../api/docs/entities/branch.md?raw'
import entityProductMd from '../../api/docs/entities/product.md?raw'
import entityMenuMd from '../../api/docs/entities/menu.md?raw'
import entityCategoryMd from '../../api/docs/entities/category.md?raw'
import entityModifierGroupMd from '../../api/docs/entities/modifier-group.md?raw'
import entityStationMd from '../../api/docs/entities/station.md?raw'
import entityPreparationTaskStationMd from '../../api/docs/entities/preparation-task-station.md?raw'
import entityConversationMd from '../../api/docs/entities/conversation.md?raw'
import entityFeedbackMd from '../../api/docs/entities/feedback.md?raw'
import entityAnalyticsMd from '../../api/docs/entities/analytics.md?raw'
import authMd from '../../api/docs/authentication.md?raw'
import ownerMd from '../../api/docs/owner.md?raw'
import businessMd from '../../api/docs/business.md?raw'
import catalogMd from '../../api/docs/catalog.md?raw'
import categoriesMd from '../../api/docs/categories.md?raw'
import customersMd from '../../api/docs/customers.md?raw'
import progressiveDiscountMd from '../../api/docs/progressive-discount.md?raw'
import addressSearchMd from '../../api/docs/address-search.md?raw'
import ordersMd from '../../api/docs/orders.md?raw'
import orderIntentsMd from '../../api/docs/order-intents.md?raw'
import dispatchMd from '../../api/docs/dispatch.md?raw'
import dispatchRouteMd from '../../api/docs/dispatch-route.md?raw'
import driverMd from '../../api/docs/driver.md?raw'
import analyticsMd from '../../api/docs/analytics.md?raw'
import feedbackMd from '../../api/docs/feedback.md?raw'
import stationsMd from '../../api/docs/stations.md?raw'
import integrationsMd from '../../api/docs/integrations.md?raw'
import chatwootMd from '../../api/docs/chatwoot.md?raw'
import chatwootWebhookMd from '../../api/docs/chatwoot-webhook.md?raw'
import chatwootWebsocketMd from '../../api/docs/chatwoot-websocket.md?raw'

export type DocEntry = {
  id: string
  title: string
  group: string | null
  content: string
  sourcePath: string
}

export const docs: DocEntry[] = [
  { id: 'overview',       title: 'Overview',          group: null,                    content: overviewMd, sourcePath: 'README.md' },
  { id: 'entities',       title: 'Entities Overview', group: 'Entities',              content: entitiesMd, sourcePath: 'entities.md' },
  { id: 'entity-order',         title: 'Order',         group: 'Entities',              content: entityOrderMd, sourcePath: 'entities/order.md' },
  { id: 'entity-order-payment', title: 'OrderPayment', group: 'Entities',              content: entityOrderPaymentMd, sourcePath: 'entities/order-payment.md' },
  { id: 'entity-order-intent', title: 'OrderIntent',  group: 'Entities',              content: entityOrderIntentMd, sourcePath: 'entities/order-intent.md' },
  { id: 'entity-customer',title: 'Customer',          group: 'Entities',              content: entityCustomerMd, sourcePath: 'entities/customer.md' },
  { id: 'entity-dispatch',title: 'Dispatch',          group: 'Entities',              content: entityDispatchMd, sourcePath: 'entities/dispatch.md' },
  { id: 'entity-driver',  title: 'Driver',            group: 'Entities',              content: entityDriverMd, sourcePath: 'entities/driver.md' },
  { id: 'entity-business',title: 'Business',          group: 'Entities',              content: entityBusinessMd, sourcePath: 'entities/business.md' },
  { id: 'entity-branch',  title: 'Branch',            group: 'Entities',              content: entityBranchMd, sourcePath: 'entities/branch.md' },
  { id: 'entity-product', title: 'Product',           group: 'Entities',              content: entityProductMd, sourcePath: 'entities/product.md' },
  { id: 'entity-menu',    title: 'Menu',              group: 'Entities',              content: entityMenuMd, sourcePath: 'entities/menu.md' },
  { id: 'entity-category',title: 'Category',          group: 'Entities',              content: entityCategoryMd, sourcePath: 'entities/category.md' },
  { id: 'entity-modifier-group', title: 'Modifier Group', group: 'Entities',         content: entityModifierGroupMd, sourcePath: 'entities/modifier-group.md' },
  { id: 'entity-station', title: 'Station',           group: 'Entities',              content: entityStationMd, sourcePath: 'entities/station.md' },
  { id: 'entity-preparation-task-station', title: 'Preparation Task Station', group: 'Entities', content: entityPreparationTaskStationMd, sourcePath: 'entities/preparation-task-station.md' },
  { id: 'entity-conversation', title: 'Conversation', group: 'Entities',              content: entityConversationMd, sourcePath: 'entities/conversation.md' },
  { id: 'entity-feedback', title: 'Feedback',         group: 'Entities',              content: entityFeedbackMd, sourcePath: 'entities/feedback.md' },
  { id: 'entity-analytics', title: 'Analytics',       group: 'Entities',              content: entityAnalyticsMd, sourcePath: 'entities/analytics.md' },
  { id: 'authentication', title: 'Authentication',    group: 'Auth & Identity',       content: authMd, sourcePath: 'authentication.md' },
  { id: 'owner',          title: 'Owner',             group: 'Auth & Identity',       content: ownerMd, sourcePath: 'owner.md' },
  { id: 'business',       title: 'Business',          group: 'Business',              content: businessMd, sourcePath: 'business.md' },
  { id: 'catalog',        title: 'Catalog',           group: 'Catalog',               content: catalogMd, sourcePath: 'catalog.md' },
  { id: 'categories',     title: 'Categories',        group: 'Catalog',               content: categoriesMd, sourcePath: 'categories.md' },
  { id: 'customers',      title: 'Customers',         group: 'Catalog',               content: customersMd, sourcePath: 'customers.md' },
  { id: 'progressive-discount', title: 'Progressive Discount', group: 'Catalog',      content: progressiveDiscountMd, sourcePath: 'progressive-discount.md' },
  { id: 'address-search', title: 'Address Search',    group: 'Catalog',               content: addressSearchMd, sourcePath: 'address-search.md' },
  { id: 'orders',         title: 'Orders',            group: 'Operations',            content: ordersMd, sourcePath: 'orders.md' },
  { id: 'order-intents',  title: 'Order Intents',     group: 'Operations',            content: orderIntentsMd, sourcePath: 'order-intents.md' },
  { id: 'dispatch',       title: 'Dispatch',          group: 'Operations',            content: dispatchMd, sourcePath: 'dispatch.md' },
  { id: 'dispatch-route', title: 'Route Tracking',    group: 'Operations',            content: dispatchRouteMd, sourcePath: 'dispatch-route.md' },
  { id: 'driver',         title: 'Drivers',           group: 'Drivers',               content: driverMd, sourcePath: 'driver.md' },
  { id: 'stations',       title: 'Stations & Tasks',  group: 'Kitchen',               content: stationsMd, sourcePath: 'stations.md' },
  { id: 'analytics',      title: 'Analytics',         group: 'Analytics & Feedback',  content: analyticsMd, sourcePath: 'analytics.md' },
  { id: 'feedback',       title: 'Feedback',          group: 'Analytics & Feedback',  content: feedbackMd, sourcePath: 'feedback.md' },
  { id: 'integrations',   title: 'Integrations',      group: 'Integrations',          content: integrationsMd, sourcePath: 'integrations.md' },
  { id: 'chatwoot',       title: 'Chatwoot',          group: 'Integrations',          content: chatwootMd, sourcePath: 'chatwoot.md' },
  { id: 'chatwoot-webhook', title: 'Chatwoot Webhook', group: 'Integrations',         content: chatwootWebhookMd, sourcePath: 'chatwoot-webhook.md' },
  { id: 'chatwoot-websocket', title: 'Chatwoot WebSocket', group: 'Integrations',     content: chatwootWebsocketMd, sourcePath: 'chatwoot-websocket.md' },
]
