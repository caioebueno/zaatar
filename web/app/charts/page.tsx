export const dynamic = "force-dynamic";

import clientOrderCount from "../../src/chartData/clientOrderCout";
import OrderCountChart from "../components/orderCountChart";
import { averageTicketByMonth } from "../../src/chartData/averageTicketByMonth";
import { leadsCampaignFunnel } from "../../src/chartData/leadsCampaignFunnel";
import { getAvgOrdersPerWeekByMonth } from "../../src/chartData/getAvgOrdersPerWeekByMonth";
import { orderTotalsLast7Days } from "../../src/chartData/orderTotalsLast7Days";

import AvgTicketLineChart from "../components/AvgTicketLineChart";
import { parse, format } from "date-fns";
import LeadWhatsappFunnel from "../components/LeadWhatsappFunnel";
import AvgOrdersPerWeekLineChart from "../components/AvgOrdersPerWeekLineChart";
import OrderTotalsLast7DaysBarChart from "../components/OrderTotalsLast7DaysBarChart";
import Link from "next/link";
import MenuVisitsLast7DaysChart from "../components/MenuVisitsLast7DaysChart";
import { getMenuVisitsOverview } from "@/src/chartData/menuVisitsOverview";
import { getOrderTagsOverview } from "@/src/chartData/orderTagsOverview";

export default async function ChartsPage() {
  const clientOrderCountResponse = await clientOrderCount();
  const averageTicketByMonthResponse = await averageTicketByMonth();
  const leadsCampaignFunnelResponse =
    await leadsCampaignFunnel("lead-whatsapp");
  const getAvgOrdersPerWeekByMonthResponse = await getAvgOrdersPerWeekByMonth();
  const orderTotalsLast7DaysResponse = await orderTotalsLast7Days();
  const menuVisitsOverview = await getMenuVisitsOverview();
  const orderTagsOverview = await getOrderTagsOverview();

  return (
    <div className="bg-zinc-50 font-sans dark:bg-black px-8 py-10 ">
      <div className="pb-10 flex items-center justify-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <h1 className="text-2xl font-semibold">Informações Gerais</h1>
          <Link
            href="/drivers/earnings"
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Driver Earnings
          </Link>
          <Link
            href="/orders/amount"
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Order Amount
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pb-10">
        <OrderCountChart data={clientOrderCountResponse} />
        <AvgTicketLineChart data={averageTicketByMonthResponse} />
        <AvgOrdersPerWeekLineChart data={getAvgOrdersPerWeekByMonthResponse} />
        <OrderTotalsLast7DaysBarChart data={orderTotalsLast7DaysResponse} />
      </div>
      <div className="pb-8 flex items-center justify-center">
        <h1 className="text-2xl font-semibold">Menu Visits</h1>
      </div>
      <div className="grid grid-cols-1 gap-4 pb-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total Visits</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">
            {menuVisitsOverview.totalVisits}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Unique Visitors
          </p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">
            {menuVisitsOverview.uniqueVisitors}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Visits (7 Days)
          </p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">
            {menuVisitsOverview.visitsLast7Days}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Unique Visitors (7 Days)
          </p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">
            {menuVisitsOverview.uniqueVisitorsLast7Days}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-10 pb-10 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <MenuVisitsLast7DaysChart data={menuVisitsOverview.dailyLast7Days} />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold">Top Menus</h2>
          <div className="space-y-2">
            {menuVisitsOverview.topMenus.length === 0 ? (
              <p className="text-sm text-zinc-500">No visits yet.</p>
            ) : (
              menuVisitsOverview.topMenus.map((item) => (
                <div
                  key={`${item.menuId ?? "none"}-${item.name}`}
                  className="flex items-center justify-between rounded-md border border-zinc-100 px-3 py-2"
                >
                  <p className="text-sm font-medium text-zinc-800">{item.name}</p>
                  <span className="text-sm font-semibold text-zinc-900">
                    {item.visits}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-10 pb-10 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold">Top Promotions</h2>
          <div className="space-y-2">
            {menuVisitsOverview.topPromotions.length === 0 ? (
              <p className="text-sm text-zinc-500">No promotion visits yet.</p>
            ) : (
              menuVisitsOverview.topPromotions.map((item) => (
                <div
                  key={`${item.promotionId ?? "none"}-${item.name}`}
                  className="flex items-center justify-between rounded-md border border-zinc-100 px-3 py-2"
                >
                  <p className="text-sm font-medium text-zinc-800">{item.name}</p>
                  <span className="text-sm font-semibold text-zinc-900">
                    {item.visits}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold">Top Languages</h2>
          <div className="space-y-2">
            {menuVisitsOverview.topLanguages.length === 0 ? (
              <p className="text-sm text-zinc-500">No language data yet.</p>
            ) : (
              menuVisitsOverview.topLanguages.map((item) => (
                <div
                  key={item.language}
                  className="flex items-center justify-between rounded-md border border-zinc-100 px-3 py-2"
                >
                  <p className="text-sm font-medium text-zinc-800">
                    {item.language}
                  </p>
                  <span className="text-sm font-semibold text-zinc-900">
                    {item.visits}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="pb-8 flex items-center justify-center">
        <h1 className="text-2xl font-semibold">Orders by Tag</h1>
      </div>
      <div className="grid grid-cols-1 gap-10 pb-10 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Orders with at least one tag
          </p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">
            {orderTagsOverview.taggedOrders}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Canceled orders are excluded.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold">Top Tags</h2>
          <div className="space-y-2">
            {orderTagsOverview.topTags.length === 0 ? (
              <p className="text-sm text-zinc-500">No tagged orders yet.</p>
            ) : (
              orderTagsOverview.topTags.map((item) => (
                <div
                  key={item.tag}
                  className="flex items-center justify-between rounded-md border border-zinc-100 px-3 py-2"
                >
                  <p className="text-sm font-medium text-zinc-800">{item.tag}</p>
                  <span className="text-sm font-semibold text-zinc-900">
                    {item.orders}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="pb-10 flex items-center justify-center">
        <h1 className="text-2xl font-semibold">Campanhas</h1>
      </div>
      <div className="grid grid-cols-[350px_auto]">
        <div>
          <h2 className="text-lg font-semibold mb-3">
            Envio de Whatsapp para Leads
          </h2>
          <p className="mb-2">
            Disparo de mensagens via Whatsapp para leads que nunca efetuaram
            nenhum pedido
          </p>
          <p>
            <b>Data de início: </b>
            {format(
              parse("15-02-2026", "dd-MM-yyyy", new Date()),
              "dd MMM yyyy",
            )}
          </p>
        </div>
        <div className="grid grid-cols-2">
          <LeadWhatsappFunnel data={leadsCampaignFunnelResponse} />
        </div>
      </div>
    </div>
  );
}
