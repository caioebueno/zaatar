import overviewMd from '../../api/docs/README.md?raw'
import authMd from '../../api/docs/authentication.md?raw'
import ownerMd from '../../api/docs/owner.md?raw'
import businessMd from '../../api/docs/business.md?raw'
import catalogMd from '../../api/docs/catalog.md?raw'
import ordersMd from '../../api/docs/orders.md?raw'
import dispatchMd from '../../api/docs/dispatch.md?raw'
import dispatchRouteMd from '../../api/docs/dispatch-route.md?raw'
import driverMd from '../../api/docs/driver.md?raw'
import analyticsMd from '../../api/docs/analytics.md?raw'
import feedbackMd from '../../api/docs/feedback.md?raw'
import stationsMd from '../../api/docs/stations.md?raw'
import integrationsMd from '../../api/docs/integrations.md?raw'

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
  { id: 'orders',         title: 'Orders',            group: 'Operations',            content: ordersMd },
  { id: 'dispatch',       title: 'Dispatch',          group: 'Operations',            content: dispatchMd },
  { id: 'dispatch-route', title: 'Route Tracking',    group: 'Operations',            content: dispatchRouteMd },
  { id: 'driver',         title: 'Drivers',           group: 'Drivers',               content: driverMd },
  { id: 'stations',       title: 'Stations & Tasks',  group: 'Kitchen',               content: stationsMd },
  { id: 'analytics',      title: 'Analytics',         group: 'Analytics & Feedback',  content: analyticsMd },
  { id: 'feedback',       title: 'Feedback',          group: 'Analytics & Feedback',  content: feedbackMd },
  { id: 'integrations',   title: 'Integrations',      group: 'Integrations',          content: integrationsMd },
]
