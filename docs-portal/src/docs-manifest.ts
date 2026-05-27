import overviewMd from '../../api/docs/README.md?raw'
import authMd from '../../api/docs/authentication.md?raw'
import ownerMd from '../../api/docs/owner.md?raw'
import businessMd from '../../api/docs/business.md?raw'
import catalogMd from '../../api/docs/catalog.md?raw'
import categoriesMd from '../../api/docs/categories.md?raw'
import customersMd from '../../api/docs/customers.md?raw'
import progressiveDiscountMd from '../../api/docs/progressive-discount.md?raw'
import addressSearchMd from '../../api/docs/address-search.md?raw'
import ordersMd from '../../api/docs/orders.md?raw'
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
  { id: 'authentication', title: 'Authentication',    group: 'Auth & Identity',       content: authMd },
  { id: 'owner',          title: 'Owner',             group: 'Auth & Identity',       content: ownerMd },
  { id: 'business',       title: 'Business',          group: 'Business',              content: businessMd },
  { id: 'catalog',        title: 'Catalog',           group: 'Catalog',               content: catalogMd },
  { id: 'categories',     title: 'Categories',        group: 'Catalog',               content: categoriesMd },
  { id: 'customers',      title: 'Customers',         group: 'Catalog',               content: customersMd },
  { id: 'progressive-discount', title: 'Progressive Discount', group: 'Catalog',      content: progressiveDiscountMd },
  { id: 'address-search', title: 'Address Search',    group: 'Catalog',               content: addressSearchMd },
  { id: 'orders',         title: 'Orders',            group: 'Operations',            content: ordersMd },
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
