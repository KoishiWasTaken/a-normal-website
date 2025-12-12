'use client'

import { useState } from 'react'

interface CustomChessboardProps {
  position: string // FEN string
  onPieceDrop: (sourceSquare: string, targetSquare: string) => boolean
  isDraggable: boolean
}

const pieceUnicode: { [key: string]: string } = {
  wP: '♙', wN: '♘', wB: '♗', wR: '♖', wQ: '♕', wK: '♔',
  bP: '♟', bN: '♞', bB: '♝', bR: '♜', bQ: '♛', bK: '♚'
}

export default function CustomChessboard({ position, onPieceDrop, isDraggable }: CustomChessboardProps) {
  const [draggedFrom, setDraggedFrom] = useState<string | null>(null)
  const [draggedOver, setDraggedOver] = useState<string | null>(null)

  // Parse FEN to get piece positions
  const parseFEN = (fen: string) => {
    const board: { [key: string]: string } = {}
    const rows = fen.split(' ')[0].split('/')
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

    rows.forEach((row, rankIndex) => {
      let fileIndex = 0
      for (const char of row) {
        if (isNaN(Number(char))) {
          // It's a piece
          const rank = 8 - rankIndex
          const file = files[fileIndex]
          const square = `${file}${rank}`
          const color = char === char.toUpperCase() ? 'w' : 'b'
          const piece = char.toUpperCase()
          board[square] = `${color}${piece}`
          fileIndex++
        } else {
          // It's empty squares
          fileIndex += Number(char)
        }
      }
    })

    return board
  }

  const board = parseFEN(position)
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1]

  const handleDragStart = (e: React.DragEvent, square: string) => {
    console.log('🔵 DRAG START:', square)
    setDraggedFrom(square)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', square)
  }

  const handleDragOver = (e: React.DragEvent, square: string) => {
    e.preventDefault()
    setDraggedOver(square)
  }

  const handleDragLeave = () => {
    setDraggedOver(null)
  }

  const handleDrop = (e: React.DragEvent, targetSquare: string) => {
    e.preventDefault()
    console.log('🎯 DROP:', { from: draggedFrom, to: targetSquare })

    if (!draggedFrom) return

    const moveSuccessful = onPieceDrop(draggedFrom, targetSquare)
    console.log('✅ Move successful:', moveSuccessful)

    setDraggedFrom(null)
    setDraggedOver(null)
  }

  const handleDragEnd = () => {
    console.log('🔴 DRAG END')
    setDraggedFrom(null)
    setDraggedOver(null)
  }

  return (
    <div className="w-full aspect-square bg-slate-800 rounded-lg overflow-hidden border-4 border-blue-500/30 shadow-2xl shadow-blue-500/20">
      <div className="w-full h-full grid grid-cols-8 grid-rows-8">
        {ranks.map((rank) =>
          files.map((file) => {
            const square = `${file}${rank}`
            const piece = board[square]
            const isLight = (files.indexOf(file) + rank) % 2 === 0
            const isDragSource = draggedFrom === square
            const isDragTarget = draggedOver === square
            const isPieceWhite = piece && piece[0] === 'w'
            const canDrag = isDraggable && isPieceWhite && piece

            return (
              <div
                key={square}
                className={`relative flex items-center justify-center ${
                  isLight ? 'bg-[#475569]' : 'bg-[#1e293b]'
                } ${isDragSource ? 'opacity-50' : ''} ${
                  isDragTarget ? 'ring-4 ring-blue-400 ring-inset' : ''
                } transition-all`}
                onDragOver={(e) => handleDragOver(e, square)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, square)}
              >
                {piece && (
                  <div
                    draggable={canDrag}
                    onDragStart={(e) => canDrag && handleDragStart(e, square)}
                    onDragEnd={handleDragEnd}
                    className={`text-5xl md:text-6xl select-none ${
                      canDrag ? 'cursor-move hover:scale-110' : 'cursor-not-allowed'
                    } transition-transform`}
                  >
                    {pieceUnicode[piece]}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
