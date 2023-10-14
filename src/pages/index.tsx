import Head from "next/head";
import Image from "next/image";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useCallback, useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [snake, setSnake] = useState([
    { x: 20 / 2, y: 20 / 2 },
    { x: 20 / 2 + 1, y: 20 / 2 },
  ]);
  const [direction, setDirection] = useState("STOP");
  const [score, setScore] = useState(0);
  const [play, setPlay] = useState(false);
  const [status, setStatus] = useState("STOPPED");

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

  const renderFood = useCallback(() => {
    let xPosition = Math.floor(Math.random() * 20);
    let yPosition = Math.floor(Math.random() * 20);
    setFood({ x: xPosition, y: yPosition });
  }, []);

  const updateGame = useCallback(() => {
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
      setScore((prevState) => prevState + 0.0001);
      renderFood();
    } else if (direction !== "STOP") {
      newSnake.pop();
    }

    setSnake(newSnake);
  }, [direction, food.x, food.y, gameOver, renderFood, snake]);

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

  const handlePlay = useCallback(() => {
    setPlay(true);
    setDirection("UP");
    setStatus("PLAYING");
  }, []);

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
      <main className={`${styles.main} ${inter.className}`}>
        <nav className={styles.navbar}>
          <Image src={"/logo.png"} width={120} height={120} alt="Logo" />
          <h1 className={styles.title}>SNAKE 2 EARN</h1>
          <WalletMultiButton />
        </nav>
        <div className={styles.score}>
          COLLECTED SOL: <span>{score.toFixed(4).replace(/\.?0+$/, "")}</span>
        </div>
        <div className={styles.board}>{renderBoard()}</div>
        <button className={styles.play} onClick={handlePlay}>
          {status === "STOPPED" ? "PLAY" : "PLAYING"}
        </button>
      </main>
    </>
  );
}
