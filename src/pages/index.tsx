import Head from "next/head";
import Image from "next/image";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useCallback, useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import toast from "react-hot-toast";
import { useWallet } from "@solana/wallet-adapter-react";
import { useFaucetContext } from "@/context/faucet";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
  Text,
  Flex,
  Box,
} from "@chakra-ui/react";
import CopyToClipboard from "react-copy-to-clipboard";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [snake, setSnake] = useState([
    { x: 20 / 2, y: 20 / 2 },
    { x: 20 / 2 + 1, y: 20 / 2 },
  ]);
  const [direction, setDirection] = useState("STOP");
  const [score, setScore] = useState(0);
  const [play, setPlay] = useState(false);
  const [status, setStatus] = useState("STOPPED");
  const [txHash, setTxHash] = useState("");
  const { publicKey, connected, signMessage } = useWallet();
  const {
    initialize,
    deposit_vault,
    init_user_pool,
    request_faucet,
    isUserInitialized,
    claimed,
  } = useFaucetContext();

  function renderBoard() {
    let cellArray = [];
    for (let row = 0; row < 20; row++) {
      for (let col = 0; col < 20; col++) {
        let isFood = food.x === row && food.y === col;
        let isSnake = snake.some((ele) => ele.x == row && ele.y === col);

        let cell = (
          <div
            className={
              isFood ? styles.food : isSnake ? styles.snake : styles.cell
            }
            key={`${row}-${col}`}
          ></div>
        );
        cellArray.push(cell);
      }
    }
    return cellArray;
  }

  const gameOver = useCallback(() => {
    setDirection("STOP");
    setSnake([
      { x: 20 / 2, y: 20 / 2 },
      { x: 20 / 2 + 1, y: 20 / 2 },
    ]);
    setScore(0);
    setPlay(false);
    setStatus("STOPPED");
  }, []);

  const claim = useCallback(() => {
    setDirection("STOP");
    setSnake([
      { x: 20 / 2, y: 20 / 2 },
      { x: 20 / 2 + 1, y: 20 / 2 },
    ]);
    setScore(0);
    setPlay(false);
    setStatus("CLAIM");
  }, []);

  const renderFood = useCallback(() => {
    let xPosition = Math.floor(Math.random() * 20);
    let yPosition = Math.floor(Math.random() * 20);
    setFood({ x: xPosition, y: yPosition });
  }, []);

  const updateGame = useCallback(async () => {
    if (direction === "STOP") return;
    if (
      snake[0].x < 0 ||
      snake[0].x > 20 ||
      snake[0].y < 0 ||
      snake[0].y > 20
    ) {
      console.log("GAME OVER");
      gameOver();
      return;
    }

    let isBit = snake
      .slice(1)
      .some((ele) => ele.x === snake[0].x && ele.y === snake[0].y);

    if (isBit) {
      gameOver();
      return;
    }

    let newSnake = [...snake];

    switch (direction) {
      case "STOP":
        newSnake.unshift({ x: newSnake[0].x, y: newSnake[0].y });
        break;
      case "LEFT":
        newSnake.unshift({ x: newSnake[0].x, y: newSnake[0].y - 1 });
        break;
      case "RIGHT":
        newSnake.unshift({ x: newSnake[0].x, y: newSnake[0].y + 1 });
        break;
      case "UP":
        newSnake.unshift({ x: newSnake[0].x - 1, y: newSnake[0].y });
        break;
      case "DOWN":
        newSnake.unshift({ x: newSnake[0].x + 1, y: newSnake[0].y });
        break;
    }

    let isAteFood = newSnake[0].x === food.x && newSnake[0].y === food.y;

    if (isAteFood) {
      if (score === 0.0005) {
        gameOver();
        const txHash = await request_faucet();
        setTxHash(txHash);
        onOpen();
        return toast.success("Congratulations!");
      }
      setScore((prevState) => prevState + 0.0001);
      renderFood();
    } else if (direction !== "STOP") {
      newSnake.pop();
    }

    setSnake(newSnake);
  }, [claim, direction, food.x, food.y, gameOver, renderFood, score, snake]);

  const updateDirection = useCallback(
    (e: any) => {
      let code = e.code;
      if (direction === "STOP") return;
      if (status === "STOPPED") return;

      switch (code) {
        case "ArrowUp":
          if (direction !== "DOWN") {
            setDirection("UP");
          }
          break;
        case "ArrowDown":
          if (direction !== "UP") {
            setDirection("DOWN");
          }
          break;
        case "ArrowLeft":
          if (direction !== "RIGHT") {
            setDirection("LEFT");
          }
          break;
        case "ArrowRight":
          if (direction !== "LEFT") {
            setDirection("RIGHT");
          }
          break;
      }
    },
    [direction, status]
  );

  const handlePlay = useCallback(async () => {
    if (!publicKey || !connected || !signMessage) {
      return toast.error("Connect your wallet first!");
    }
    if (claimed >= 0.001) {
      return toast.error("you have exceeded the withdrawal limit!");
    }
    setPlay(true);
    setDirection("UP");
    setStatus("PLAYING");
  }, [connected, publicKey, signMessage, claimed]);

  const initAccount = useCallback(async () => {
    if (!publicKey || !connected) {
      return toast.error("Connect your wallet first!");
    }

    await init_user_pool();
  }, [connected, publicKey]);

  useEffect(() => {
    let interval = setInterval(updateGame, 150);
    return () => clearInterval(interval);
  }, [updateGame]);

  useEffect(() => {
    if (play) {
      document.addEventListener("keydown", updateDirection);
    } else {
      return () => clearInterval("keydown");
    }
  }, [play, updateDirection]);

  return (
    <>
      <Head>
        <title>Snake 2 Earn</title>
        <meta name="description" content="🐍 Snake 2 Earn" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo.png" />
      </Head>
      <Flex
        flexDirection={"column"}
        justifyContent={"center"}
        alignItems={"center"}
        padding={"1rem"}
        minH={"100vh"}
        background={"#2a1654"}
      >
        <Flex
          width={"100%"}
          top={0}
          position={"fixed"}
          padding={"10px"}
          flexDirection={"row"}
          justifyContent={"space-between"}
          alignItems={"center"}
        >
          <Image src={"/logo.png"} width={120} height={120} alt="Logo" />
          <Text
            fontFamily={'"VT323", monospace'}
            position={"absolute"}
            top={"50%"}
            left={"50%"}
            transform={"translate(-50%, -50%)"}
            fontSize={"64px"}
            color={"#FFFFFF"}
          >
            SNAKE 2 EARN
          </Text>
          <Flex align={"center"} gap={"5px"}>
            <Text
              color={"#FFFFFF"}
              fontFamily={'"VT323", monospace'}
              fontSize={"24px"}
              cursor={"pointer"}
            >
              Devnet
            </Text>
            <WalletMultiButton />
          </Flex>
        </Flex>
        <Box
          color={"#FFFFFF"}
          fontSize={"20px"}
          fontFamily={'"VT323", monospace'}
        >
          COLLECTED SOL: <span>{score.toFixed(4).replace(/\.?0+$/, "")}</span>
        </Box>
        <Box
          display={"grid"}
          gridTemplateColumns={"repeat(20, 20px)"}
          gridTemplateRows={"repeat(20, 20px)"}
          width={"max-content"}
          marginTop={"10px"}
          border={"3px solid #FFFFFF"}
        >
          {renderBoard()}
        </Box>
        {isUserInitialized && (
          <Button
            fontSize={"60px"}
            fontFamily={'"VT323", monospace'}
            marginTop={"20px"}
            background={"transparent"}
            border={"none"}
            color={"#FFFFFF"}
            onClick={handlePlay}
            _hover={{
              background: "transparent",
            }}
          >
            PLAY
          </Button>
        )}
        {!isUserInitialized && (
          <Button
            fontSize={"60px"}
            fontFamily={'"VT323", monospace'}
            marginTop={"20px"}
            background={"transparent"}
            border={"none"}
            color={"#FFFFFF"}
            _hover={{
              background: "transparent",
            }}
            onClick={initAccount}
          >
            INIT
          </Button>
        )}
      </Flex>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent
          background={"#2a1654"}
          border={"3px solid #FFFFFF"}
          color={"#FFFFFF"}
          fontFamily={'"VT323", monospace'}
        >
          <ModalHeader>Modal Title</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize={24}>Congratulations!</Text>
            <Text fontSize={24}>You won 0.0005 SOL</Text>
            <CopyToClipboard
              text={`https://solscan.io/tx/${txHash}?cluster=devnet`}
              onCopy={() => toast.success("Successfully copied to clipboard")}
            >
              <Text
                marginTop={"10px"}
                fontSize={24}
              >{`https://solscan.io/tx/${txHash}?cluster=devnet`}</Text>
            </CopyToClipboard>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
