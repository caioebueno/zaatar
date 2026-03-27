import { getDistance } from "./distance";

const main = async () => {
  const response = await getDistance(
    "16419 Happy Eagle Dr, Four Corners",
    "1534 Discovery St, Davenport",
  );
  console.log(response);
};

main();
