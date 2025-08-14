import { useState, useEffect, useRef, JSX } from "react";

/**
 * Renders a single square (cell) that could be within a grid.
 *
 * This component displays the current value of the cell and handles click events.
 * If the cell is part of a winning combination, it receives a specific style.
 * 
 * @param {string|number|null} value Content of the cell.
 * @param {Function} onSquareClick Function to execute when the square is clicked.
 * @param {boolean} isWinningSquare Indicates whether the cell is part of a winning sequence.
 * 
 * @returns {JSX.Element} A styled button element representing a square.
 */
function Square({value, onSquareClick, isWinningSquare}) {
  return <button className={`square ${isWinningSquare ? 'winning' : ''}`} onClick={onSquareClick}>
    {value}
  </button>;
}

/**
 * Builds and renders a 3x3 Tic-Tac-Toe board.
 * 
 * @param {boolean} xIsNext Indicates whether it's 'X' turn to play.
 * @param {(string|null)[]} squares Flat array of 9 squares (indexed from 0 to 8).
 * @param {Function} onPlay FCallback that handles the game logic when a cell is clicked.
 * @param {number[]} winningSquares Array that contains the 3 current winning cells, or null if there isn't.
 * @param {Function} onWin Callback triggered when a winning combination is detected.
 * 
 * @returns {JSX.Element} A div containg the whole board (as a 3x3 grid).
 */
function Board({xIsNext, squares, onPlay, winningSquares, onWin}) {
  /**
   * Handles a click event on a cell in the 3x3 grid.
   * 
   * Prevents action if the selected cell is already filled or if a winner has been determined.
   * If the move is valid, it updates the game state and notifies the parent via the `onPlay` callback.
   * 
   * @param {number} i Row index of the cell, from 0 to 2.
   * @param {number} j Column index of the cell, from 0 to 2.
   */
  function handleClick(i, j) {
    const index = i * 3 + j;
    if(squares[index] || calculateWinner(squares)){ // Do nothing if the cell isn't empty or there's already a winner
      return;
    }
    const nextSquares = squares.slice(); // Copy
    if(xIsNext){
      nextSquares[index] = "X";
    }else{
      nextSquares[index] = "O";
    }
    onPlay(nextSquares, [i, j]);
  }

  const winState = calculateWinner(squares);
  let status;

  if (winState) {
    status = winState.winner + " a gagné !";
  } else if(squares.includes(null)) {
    status = "Prochain tour : " + (xIsNext ? "X" : "O");
  } else {
    status = "Match nul !"
  }

  // useEffect triggers onWin only once, when a winner is first detected
  useEffect(() => {
    if (winState && !winningSquares) {
      onWin(winState.squares);
    }
  }, [winState, winningSquares, onWin]);

  // Renders the 3x3 game board with Square components and their current values
  const board = [];
  for(let i = 0; i < 3; i++) {
    const rows = [];
    for(let j = 0; j < 3; j++) {
      rows.push(<Square key={i + 3 * j} value={squares[i * 3 + j]} onSquareClick={() => handleClick(i, j)} isWinningSquare={winningSquares && winningSquares.includes(i * 3 + j)}></Square>)
    }
    board.push(<div key={i} className="board-row">{rows}</div>);
  }

  return (
    <>
    <div className="status">{status}</div>
    {board}
    </>
  );
}


export default function Game() {
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];
  const [isIncreasingOrder, setIsIncreasingOrder] = useState(true);
  const [winningSquares, setWinningSquares] = useState(null);
  let moveHistory = useRef([]);

  function handlePlay(nextSquares, moveCoords) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1)
    moveHistory.current = [...moveHistory.current.slice(0, currentMove), moveCoords];
  }

  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
    setWinningSquares(null);
  }

  function switchOrder() {
    setIsIncreasingOrder(!isIncreasingOrder);
  }

  function handleWin(squares) {
    setWinningSquares(squares);
  }

  const moves = history.map((squares, move) => {
    let description;
    if(move === history.length - 1) {
      const lastCoords = moveHistory.current.at(-1);
      const coordsTxt = lastCoords ? ` (${lastCoords[0]}, ${lastCoords[1]})` : "";
      return (
          <div key={move}>
              Vous êtes au coup {move}{coordsTxt}
          </div>
      );
    }
    if (move > 0){
      description = "Aller au coup #" + move + " (" + moveHistory.current[move - 1] + ")";
    } else {
      description = "Revenir au début";
    }
    return (
      <li key={squares.toString()}>
        <button onClick={() => jumpTo(move)}>{description}</button>
      </li>
    );
  });
  return (
    <div className="game">
      <div className="game-board">
        <Board xIsNext={xIsNext} squares = {currentSquares} onPlay = {handlePlay} winningSquares = {winningSquares} onWin={handleWin}/>
      </div>
      <div className="game-info">
        <button onClick={switchOrder}>Change order</button>
        <ol>{isIncreasingOrder ? moves : moves.reverse()}</ol>
      </div>
    </div>
  );
}

/**
 * Determines the winning state of a Tic-Tac-Toe board.
 *
 * This function checks all possible winning combinations on the board.
 * If a winning combination is found, it returns an object containing the
 * winner symbol ('X' or 'O') and the indices of the winning squares.
 * If there is no winner, it returns null.
 * 
 * @param {string[][]} squaresA flat array of 9 strings representing the game board.
 * Each string is either 'X', 'O', or null/empty for empty squares.
 * 
 * @returns {{ winner: string, squares: number[] } | null} An object containing the winner symbol and 
 * the winning line, or null if no winner.
 */
function calculateWinner(squares) {
  // All winning lines
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];
  for(let i= 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) { // The symbols of the winning line are all the same
      return {
        winner: squares[a],
        squares: [a, b, c]
      };
    }
  }
  return null;
}