import React, { useState, useRef, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  discord,
  logo,
  reddit,
  telegram,
  twitter,
  lock,
  arrow,
  metamask,
  bscScan,
  close,
  menu,
  arrowDown,
  leftArrow,
  rightArrow,
  lock1,
  logo_top,
  unlock,
  new_arrow,
} from "../assets";
import { useSigner, useProvider } from "wagmi";
import { ethers } from "ethers";
import Values from "../contract/values.json";
import { tokenAbi, stakingAbi } from "../contract";
import { fetchTx } from "./fetchTx";
import { decoder } from "./decode";
// import { priceFinder } from "./priceFinder";
import {
  // searchPairsMatchingQuery,
  searchPairsMatchingQuery,
} from "dexscreener-api";

import { Number, NumberFloat } from "./Number";



function StaticAddressComponent(props) {
    console.log(props.address);
  const [totalStaked, setTotalStaked] = useState(0);
  const [totalLocked, setTotalLocked] = useState(0);
  const [lockDuration, setLockDuration] = useState("0");
  const [unlockTime, setUnlockTime] = useState("-");
  const [isLocked, setIsLocked] = useState();
  const [amountLocked, setAmountLocked] = useState(0);
  const [boostYield, setBoostYield] = useState(0);
  const [amountProfited, setAmountProfited] = useState(0);
  const [avgLockDuration, setAvgLockDuration] = useState();
  const { data: signer, isError, isLoading } = useSigner();
  const provider = useProvider();
  // const [show, setShow] = useState(true);
  const [colList, setColList] = useState([
    "Hash",
    "Account",
    "Action",
    "Time",
    "Amount",
    "USD",
    "LockTime",
  ]);
  const [activeCol, setActiveCol] = useState(0);
  const [colListSmall, setColListSmall] = useState(["Hash", "Account"]);
  const [dropDown, setDropDown] = useState(false);
  const [userAddress, setUserAddress] = useState(props.address);

  const [options, setOptions] = useState([
    "Action",
    "Time",
    "Amount",
    "USD",
    "LockTime",
  ]);
  const [txlist, setTxList] = useState([]);
  const [pages, setPages] = useState([]);
  const [page, setPage] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [usdPrice, setUsdPrice] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {}, [activeCol]);

  // let usdPrice = priceFinder();
  // console.log(usdPrice);

  const priceFinder = async () => {
    // Get pairs matching base token address
    // const tokensResponse = await getPairsMatchingBaseTokenAddress(
    //   "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"
    // );
    const searchResponse = await searchPairsMatchingQuery("CAKE USDT");
    const val = searchResponse.pairs?.find(
      (data) => data.dexId === "pancakeswap"
    );
    // console.log(val.priceUsd);
    setUsdPrice(val.priceUsd || 0);
  };

  useEffect(() => {
    getPoolInfo();
    getUserInfo();
    priceFinder();
  }, [signer, userAddress]);

  const fetchData = () => {
    getPoolInfo();
    getUserInfo();
    priceFinder();
  };

  const fetchPages = async () => {
    if (page === 0) {
      var temp = await fetchTx();
      // console.log(temp);
      setPages(temp);
    }
  };

  useEffect(() => {
    const myInterval = setInterval(fetchData, 2000);

    return () => {
      // should clear the interval when the component unmounts
      clearInterval(myInterval);
    };
  }, []);

  useEffect(() => {
    const myInterval = setInterval(fetchPages, 20000);

    return () => {
      // should clear the interval when the component unmounts
      clearInterval(myInterval);
    };
  }, [pages]);

  useEffect(() => {}, [usdPrice]);

  const handleTxDecode = async () => {
    if (pages.length <= page) return;
    let temp = await Promise.all(
      pages[page].map(async (tx) => {
        if (tx.decoded) return tx;
        var res = await decoder(tx);

        return {
          ...tx,
          amount: Math.floor(res.amount * 100) / 100 || 0,
          locktime: res.lockTime || 0,
          decoded: true,
          usd: (
            Math.floor(res.amount * usdPrice * 100) / 100 || 0
          ).toLocaleString(),
        };
      })
    );
    setTxList(temp);
  };

  useEffect(() => {
    const fn = async () => {
      var temp = await fetchTx();
      setPages(temp);

      temp[page].forEach(async (tx) => {
        if (tx.decoded) return;
        var res = await decoder(tx);
        tx.amount = Math.floor(res.amount * 100) / 100 || 0;
        tx.locktime = res.lockTime || 0;
        tx.decoded = true;
        tx.usd = Math.floor(res.amount * usdPrice * 100) / 100 || 0;
      });
      setTxList(temp[page]);
      // temp.forEach((tx) => {
      //   txlist.push(tx);
      // });
    };
    fn();
  }, []);

  const handleChangeUp = async () => {
    // console.log("up");
    if (pages.length > page + 1) {
      var temp = page + 1;
      setPage(temp);
      setPageNumber(temp + 1);
      setTxList(pages[temp]);
    }
  };

  const handleChangeDown = () => {
    if (page > 0) {
      var temp = page - 1;
      setPage(temp);
      setPageNumber(temp + 1);
      setTxList(pages[temp]);
    }
  };

  const handleCustomChange = (event) => {
    event.preventDefault();
    // console.log("here it comes");
    var val = parseInt(event.target.value);
    if (val === "") {
      setPage(0);
      setPageNumber(null);
    }
    if (parseInt(val) < pages.length) {
      setPage(val - 1);
      // console.log(val, "8888888888888888888888888888");
      setPageNumber(val);
      setTxList(pages[val]);
    }
  };

  useEffect(() => {}, [pages]);

  useEffect(() => {
    const fn = async () => {
      await priceFinder();
    };
    fn();
  });

  useEffect(() => {
    handleTxDecode();
    // console.log(page);
  }, [page, pages, pageNumber]);

  useEffect(() => {
    // console.log(txlist);
  }, [txlist]);

  const getPoolInfo = async () => {
    let rpcUrl = Values.rpcURl;
    let provider_ = new ethers.providers.JsonRpcProvider(rpcUrl);
    let stake_temp = new ethers.Contract(
      Values.stackingaddress,
      stakingAbi,
      provider_
    );

    var available = ethers.utils.formatEther(await stake_temp.available());
    var locked = ethers.utils.formatEther(await stake_temp.totalLockedAmount());
    var maxDuration = parseInt(await stake_temp.MAX_LOCK_DURATION());
    var minDuration = parseInt(await stake_temp.MIN_LOCK_DURATION());

    // console.log(maxDuration, minDuration);

    setAvgLockDuration((maxDuration - minDuration) / 2 / 86400 / 7);
    setTotalStaked(Math.floor(available));
    setTotalLocked(Math.floor(locked));
  };

  const getUserInfo = async () => {
    console.log("hello world");
    let rpcUrl = Values.rpcURl;
    let provider_ = new ethers.providers.JsonRpcProvider(rpcUrl);
    let stake_temp = new ethers.Contract(
      Values.stackingaddress,
      stakingAbi,
      provider_
    );
    let token_temp = new ethers.Contract(
      Values.tokenAddress,
      tokenAbi,
      provider_
    );
    // console.log(token_temp);
    var userinfo = await stake_temp.userInfo(
      userAddress || signer?.getAddress()
    );
    var startTime = parseInt(userinfo.lockStartTime);
    var endTime = parseInt(userinfo.lockEndTime);
    var duration = Math.max(endTime - new Date().getTime() / 1000, 0);
    var boostedAmount = parseFloat(
      ethers.utils.formatEther(userinfo.userBoostedShare)
    );
    var amount = parseFloat(ethers.utils.formatEther(userinfo.lockedAmount));
    setLockDuration(Math.floor(duration / 86400));

    endTime = new Date(endTime * 1000);
    // console.log(amount + 1);
    setUnlockTime(endTime.toDateString() + " " + endTime.toLocaleTimeString());
    setIsLocked(duration <= 0 ? false : true);
    setAmountLocked(amount);
    var temp_yield =
      Math.floor(((amount + boostedAmount) * 100) / amount) / 100;

    var recent_profit =
      (boostedAmount *
        (Math.min(new Date().getTime() / 1000, userinfo.lockEndTime) -
          userinfo.lockStartTime)) /
      (userinfo.lockEndTime - userinfo.lockStartTime);
    // console.log(amount + boostedAmount);
    setBoostYield(temp_yield);
    setAmountProfited(recent_profit.toFixed(7));
  };

  const handleToggle = () => {
    setShow(!show);
  };

  const handleDropDown = () => {
    setDropDown(!dropDown);
  };

  useEffect(() => {}, [signer]);

  useEffect(() => {}, [show, txlist, dropDown]);

  const addToToken = async () => {
    const tokenAddress = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82";
    const tokenSymbol = "CAKE";
    const tokenDecimals = 18;
    const tokenImage = "";

    try {
      // wasAdded is a boolean. Like any RPC method, an error may be thrown.
      const wasAdded = await ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20", // Initially only supports ERC20, but eventually more!
          options: {
            address: tokenAddress, // The address that the token is at.
            symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals: tokenDecimals, // The number of decimals in the token
            image: tokenImage, // A string url of the token logo
          },
        },
      });

      if (wasAdded) {
        console.log("Thanks for your interest!");
      } else {
        console.log("Your loss!");
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    
      <div className="flex bg-[#035D68] rounded-xl p-6 px-[2rem] md:mx-[9rem] ss:mx-[2rem]  my-[1rem] mx-[10px] justify-around flex-col ">
        <div className="flex w-full justify-between ss:flex-row flex-col gap-y-[0.3rem]">
          <div className="flex ss:w-[20%] w-full flex-col ss:justify-start justify-center ">
            <div className="text-white mb-[0.5rem]">Wallet Address&nbsp;:<div className="truncate text-white">0x17927d2f8f3e60f0a396910e55477af2f499b9c4</div></div>
            <div className="text-white mb-[1rem] ss:text-[0.9rem] ss:leading-[1rem] text-[0.7rem] leading-[0.9rem] text-gray-100/50">
              Token
            </div>
            <div className="flex flex-row  align-text-center gap-x-[10px] ss:justify-start justify-center">
              <img src={logo_top} />
              <div className="text-white items-center font-bold flex ">
                Stake CAKE
              </div>
            </div>
          </div>
          <div className="flex ss:flex-row flex-col justify-around ss:pl-[8rem] ss:w-[60%] w-full flex-wrap gap-y-[1.4rem] mt-[1.4rem] ss:mt-[0] ">
            {/* <div className="flex flex-col ss:bg-transparent  ss:w-auto w-[98%]  ss:text-start text-center ">
              <div className="text-white ss:mb-[1rem] mb-[0.5rem] ss:text-[0.9rem] text-start px-[0.7rem] ss:leading-[1rem] text-[0.7rem] leading-[0.9rem] ">
                Recent profit
              </div>
              <div className="flex flex-col ss:bg-transparent bg-[#027785] ss:py-0 p-[0.7rem] rounded-md align-text-center justify-center gap-y-[1px]">
                <div className="text-white text-[1rem] leading-[1.2rem] font-thick">
                  {Math.floor(amountProfited * 100000) / 100000}
                </div>
                <div className="ss:text-white text-gray-200/50 items-center ss:justify-start justify-center font-thin flex text-[0.8rem] leading-[0.9rem] w-full">
                  Stake CAKE
                </div>
              </div>
            </div> */}
            <div className="flex  flex-col  ss:bg-transparent  ss:w-auto w-[98%]  ss:text-start text-center">
              <div className="text-white ss:mb-[1rem] mb-[0.5rem] ss:text-[0.9rem] text-start px-[0.7rem] ss:leading-[1rem] text-[0.7rem] leading-[0.9rem] ">
                Locked
              </div>
              <div className="flex flex-col ss:bg-transparent bg-[#027785] ss:py-0 p-[0.7rem] rounded-md align-text-center justify-center gap-y-[1px]">
                <div className="text-white text-[1rem] leading-[1.2rem] font-thick">
                  {(Math.floor(amountLocked * 1000) / 1000).toLocaleString()}
                </div>
                <div className="ss:text-white text-gray-200/50 items-center ss:justify-start justify-center font-thin flex text-[0.8rem] leading-[0.9rem] w-full">
                  {(
                    Math.floor(usdPrice * amountLocked * 1000) / 1000
                  ).toLocaleString()}{" "}
                  USD
                </div>
              </div>
            </div>

            {/* <div className="flex  flex-col  ss:w-auto w-[48%]  ss:text-start ">
              <div className="text-white ss:mb-[1rem] mb-[0.5rem] ss:text-[0.9rem] px-[0.7rem] ss:leading-[1rem] text-[0.7rem] leading-[0.9rem] text-gray-100/50">
                APR
              </div>
              <div className="flex flex-col ss:bg-transparent bg-[#027785] ss:py-0 p-[0.7rem] rounded-md align-text-center justify-center gap-y-[1px] h-full">
                <div className="text-white text-[1rem] leading-[1.2rem] font-thick  flex flex-row">
                  <NumberFloat n={48.32} />%
                </div>
              </div>
            </div> */}
            <div className="flex  flex-col ss:bg-transparent  ss:w-auto w-[98%]  ss:text-start text-center">
              <div className="text-white ss:mb-[1rem] mb-[0.5rem] text-start ss:text-[0.9rem] px-[0.7rem] ss:leading-[1rem] text-[0.7rem] leading-[0.9rem]">
                Total Staked
              </div>
              <div className="flex flex-col ss:bg-transparent bg-[#027785] ss:py-0 p-[0.7rem] rounded-md align-text-center justify-center gap-y-[1px]">
                <div className="text-white text-[1rem] leading-[1.2rem] font-thick">
                  <Number n={totalStaked} />
                </div>
                <div className="ss:text-white text-gray-200/50 items-center ss:justify-start justify-center font-thin flex text-[0.8rem] leading-[0.9rem] w-full">
                  CAKE
                </div>
              </div>
            </div>
          </div>

          <div
            onClick={() => {
              handleToggle();
            }}
            className="text-[#61ECFF]  cursor-pointer ss:text-[1.5rem] text-[1.2rem] ss:leading-[1.6rem] leading-[1.4rem] ss:w-[20%] w-full ss:text-center text-end"
          >
            <div className="flex flex-row items-center ss:justify-center justify-end gap-x-[15px]">
              {show ? "Hide" : "Unhide"}
              <img
                src={arrowDown}
                alt=""
                className={`ss:w-[23px] ss:h-[23px] w-[13px] h-[13px] object-contain cursor-pointer`}
              />
            </div>
          </div>
        </div>
        {true && (
          <div className={`overflow-hidden  ${show ? "h-fill" : "h-0"}`}>
            <hr class="w-full h-px my-8 bg-gray-200 border-0 dark:bg-gray-400"></hr>
            <div className="flex justify-around ss:flex-row flex-col gap-y-[1rem]">
              <div className="flex ss:flex-col flex-row ss:justify-start justify-between align-center">
                <div className="text-white items-center  font-thin flex text-[0.8rem] leading-[0.9rem] ss:mb-[1rem] ss:w-full w-[50%]">
                  Cake Locked
                </div>
                <div className="ss:w-full w-[50%]">
                  <div className="text-white font-bold ss:text-[2rem] text-[1.5rem] ss:leading-[1.7rem] leading-[1.3rem] mb-[10px]">
                    {(Math.floor(amountLocked * 1000) / 1000).toLocaleString()}
                  </div>
                  <div className="text-white items-center font-thin flex text-[0.8rem] leading-[0.9rem]">
                    {(
                      Math.floor(usdPrice * amountLocked * 1000) / 1000
                    ).toLocaleString()}{" "}
                    USD
                  </div>
                </div>
              </div>

              <div className="flex ss:flex-col flex-row ss:justify-start justify-between">
                <div className="text-white items-center font-thin flex text-[0.8rem] leading-[0.9rem] ss:mb-[1rem] ss:w-full w-[50%]">
                  Unlocks In
                </div>
                <div className="ss:w-full w-[50%]">
                  <div className="text-white font-bold ss:text-[2rem] text-[1.5rem] ss:leading-[1.7rem] leading-[1.3rem] mb-[10px]">
                    {lockDuration} Days
                  </div>
                  <div className="text-white items-center font-thin flex text-[0.8rem] leading-[0.9rem]">
                    On {unlockTime}
                  </div>
                </div>
              </div>
              <div className="flex ss:flex-col flex-row ss:justify-start justify-between">
                <div className="text-white items-center font-thin flex text-[0.8rem] leading-[0.9rem] ss:mb-[1rem] ss:w-full w-[50%]">
                  Yield boost
                </div>
                <div className="ss:w-full w-[50%]">
                  <div className="text-white font-bold ss:text-[2rem] text-[1.5rem] ss:leading-[1.7rem] leading-[1.3rem] mb-[10px] flex flex-row">
                    <NumberFloat n={boostYield || 0} /> x
                  </div>
                  <div className="text-white items-center font-thin flex text-[0.8rem] leading-[0.9rem]">
                    Lock for {Math.floor(lockDuration / 7).toLocaleString()}{" "}
                    weeks
                  </div>
                </div>
              </div>
            </div>

            <div className="flex ss:flex-row flex-col mt-[4rem] items-center">
              <div className="flex flex-col ss:w-[40%] w-[100%] ">
                <div className="flex flex-row mb-[0.7rem] ss:justify-start items-center ">
                  <div className="text-white text-[1rem] leading-[1.3rem] mr-[1.6rem]">
                    My Position
                  </div>
                  <div className="flex flex-row bg-[#00A9BE] rounded-md p-1">
                    <img
                      src={isLocked ? lock : unlock}
                      alt=""
                      className="fill-green-400 h-[20px] w-[20px] cursor-pointer"
                    />
                    <div className="text-white text-[1rem] leading-[1.3rem]">
                      {isLocked ? "Locked" : "Unlocked"}
                    </div>
                  </div>
                </div>
                <div className="flex flex-row">
                  <div className="text-gray-200/50 text-[1rem] leading-[1.3rem] mr-[5px]">
                    Total locked:
                  </div>
                  <div className="text-gray-200/50 text-[1rem] leading-[1.3rem] flex flex-row gap-x-[5px]">
                    <Number n={totalLocked} /> CAKE
                  </div>
                </div>
                <div className="flex flex-row">
                  <div className="text-gray-200/50 text-[0.7rem] leading-[0.9rem] mr-[5px]">
                    Average lock duration:
                  </div>
                  <div className="text-gray-200/50 text-[0.7rem] leading-[0.9rem] flex flex-row gap-x-[5px] ">
                    <Number n={Math.floor(avgLockDuration) || 0} /> weeks
                  </div>
                </div>
              </div>
              <div className="flex ss:flex-row flex-wrap-row ss:w-[70%] w-[100%] justify-around flex-wrap text-center ss:m-0 mt-[1.5rem] gap-y-[1.7rem]">
                <div
                  className="text-[#61ECFF] items-center underline decoration-[#61ECFF] ss:w-auto w-[48%] flex flex-row gap-x-[5px] cursor-pointer"
                  onClick={() => {
                    window.open(
                      "https://pancakeswap.finance/info/token/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"
                    );
                  }}
                >
                  See token info
                  <img src={arrow} className="w-[20px] h-[20px]" alt="" />
                </div>
                <div
                  className="text-[#61ECFF] items-center underline decoration-[#61ECFF] ss:w-auto w-[48%] flex flex-row gap-x-[5px] pl-[6px] cursor-pointer"
                  onClick={() => {
                    window.open(
                      "https://docs.pancakeswap.finance/products/syrup-pool/new-cake-pool"
                    );
                  }}
                >
                  View tutorial
                  <img src={arrow} className="w-[20px] h-[20px]" alt="" />
                </div>
                <div
                  className="text-[#61ECFF] items-center underline decoration-[#61ECFF] ss:w-auto w-[48%] flex flex-row gap-x-[5px] cursor-pointer"
                  onClick={() => {
                    window.open(
                      "https://bscscan.com/address/0x45c54210128a065de780C4B0Df3d16664f7f859e"
                    );
                  }}
                >
                  View contract
                  <img src={bscScan} className="w-[20px] h-[20px]" alt="" />
                </div>
                <div
                  className="text-[#61ECFF] items-center underline decoration-[#61ECFF] ss:w-auto w-[48%] flex flex-row whitespace-nowrap gap-x-[5px] cursor-pointer"
                  onClick={addToToken}
                >
                  Add to Wallet
                  <img src={metamask} className="w-[22px] h-[22px]" alt="" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

     
  );
}

export default StaticAddressComponent;