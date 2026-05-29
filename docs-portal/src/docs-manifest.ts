import overviewMd from '../../api/docs/README.md?raw'
import entitiesMd from '../../api/docs/entities.md?raw'
import entityOrderMd from '../../api/docs/entities/order.md?raw'
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
}

export const docs: DocEntry[] = [
  { id: 'overview',       title: 'Overview',          group: null,                    content: overviewMd },
  { id: 'entities',       title: 'Entities Overview', group: 'Entities',              content: entitiesMd },
  { id: 'entity-order',   title: 'Order',             group: 'Entities',              content: entityOrderMd },
  { id: 'entity-order-intent', title: 'OrderIntent',  group: 'Entities',              content: entityOrderIntentMd },
  { id: 'entity-customer',title: 'Customer',          group: 'Entities',              content: entityCustomerMd },
  { id: 'entity-dispatch',title: 'Dispatch',          group: 'Entities',              content: entityDispatchMd },
  { id: 'entity-driver',  title: 'Driver',            group: 'Entities',              content: entityDriverMd },
  { id: 'entity-business',title: 'Business',          group: 'Entities',              content: entityBusinessMd },
  { id: 'entity-branch',  title: 'Branch',            group: 'Entities',              content: entityBranchMd },
  { id: 'entity-product', title: 'Product',           group: 'Entities',              content: entityProductMd },
  { id: 'entity-menu',    title: 'Menu',              group: 'Entities',              content: entityMenuMd },
  { id: 'entity-category',title: 'Category',          group: 'Entities',              content: entityCategoryMd },
  { id: 'entity-modifier-group', title: 'Modifier Group', group: 'Entities',         content: entityModifierGroupMd },
  { id: 'entity-station', title: 'Station',           group: 'Entities',              content: entityStationMd },
  { id: 'entity-preparation-task-station', title: 'Preparation Task Station', group: 'Entities', content: entityPreparationTaskStationMd },
  { id: 'entity-conversation', title: 'Conversation', group: 'Entities',              content: entityConversationMd },
  { id: 'entity-feedback', title: 'Feedback',         group: 'Entities',              content: entityFeedbackMd },
  { id: 'entity-analytics', title: 'Analytics',       group: 'Entities',              content: entityAnalyticsMd },
  { id: 'authentication', title: 'Authentication',    group: 'Auth & Identity',       content: authMd },
  { id: 'owner',          title: 'Owner',             group: 'Auth & Identity',       content: ownerMd },
  { id: 'business',       title: 'Business',          group: 'Business',              content: businessMd },
  { id: 'catalog',        title: 'Catalog',           group: 'Catalog',               content: catalogMd },
  { id: 'categories',     title: 'Categories',        group: 'Catalog',               content: categoriesMd },
  { id: 'customers',      title: 'Customers',         group: 'Catalog',               content: customersMd },
  { id: 'progressive-discount', title: 'Progressive Discount', group: 'Catalog',      content: progressiveDiscountMd },
  { id: 'address-search', title: 'Address Search',    group: 'Catalog',               content: addressSearchMd },
  { id: 'orders',         title: 'Orders',            group: 'Operations',            content: ordersMd },
  { id: 'order-intents',  title: 'Order Intents',     group: 'Operations',            content: orderIntentsMd },
  { id: 'dispatch',       title: 'Dispatch',          group: 'Operations',            content: dispatchMd },
  { id: 'dispatch-route', title: 'Route Tracking',    group: 'Operations',            content: dispatchRouteMd },
  { id: 'driver',         title: 'Drivers',           group: 'Drivers',               content: driverMd },
  { id: 'stations',       title: 'Stations & Tasks',  group: 'Kitchen',               content: stationsMd },
  { id: 'analytics',      title: 'Analytics',         group: 'Analytics & Feedback',  content: analyticsMd },
  { id: 'feedback',       title: 'Feedback',          group: 'Analytics & Feedback',  content: feedbackMd },
  { id: 'integrations',   title: 'Integrations',      group: 'Integrations',          content: integrationsMd },
  { id: 'chatwoot',       title: 'Chatwoot',          group: 'Integrations',          content: chatwootMd },
  { id: 'chatwoot-webhook', title: 'Chatwoot Webhook', group: 'Integrations',         content: chatwootWebhookMd },
  { id: 'chatwoot-websocket', title: 'Chatwoot WebSocket', group: 'Integrations',     content: chatwootWebsocketMd },
]
