import clientOrderCount from "../src/chartData/clientOrderCout";
import OrderCountChart from "./components/orderCountChart";
import { averageTicketByMonth } from "../src/chartData/averageTicketByMonth";
import { leadsCampaignFunnel } from "../src/chartData/leadsCampaignFunnel";
import { getAvgOrdersPerWeekByMonth } from "../src/chartData/getAvgOrdersPerWeekByMonth";

import AvgTicketLineChart from "./components/AvgTicketLineChart";
import { parse, format } from "date-fns";
import LeadWhatsappFunnel from "./components/LeadWhatsappFunnel";
import AvgOrdersPerWeekLineChart from "./components/AvgOrdersPerWeekLineChart";

export default async function Home() {
  const clientOrderCountResponse = await clientOrderCount();
  const averageTicketByMonthResponse = await averageTicketByMonth();
  const leadsCampaignFunnelResponse =
    await leadsCampaignFunnel("lead-whatsapp");
  const getAvgOrdersPerWeekByMonthResponse = await getAvgOrdersPerWeekByMonth();
  // console.log(leadsCampaignFunnelResponse)
  return (
    <div className="bg-zinc-50 font-sans dark:bg-black px-8 py-10 ">
      <div className="pb-10 flex items-center justify-center">
        <h1 className="text-2xl font-semibold">Informações Gerais</h1>
      </div>
      <div className="grid grid-cols-3 pb-10">
        <OrderCountChart data={clientOrderCountResponse} />
        <AvgTicketLineChart data={averageTicketByMonthResponse} />
        <AvgOrdersPerWeekLineChart data={getAvgOrdersPerWeekByMonthResponse} />
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
