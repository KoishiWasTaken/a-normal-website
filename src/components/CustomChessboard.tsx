'use client'

import { useState } from 'react'

interface CustomChessboardProps {
  position: string // FEN string
  onPieceDrop: (sourceSquare: string, targetSquare: string) => boolean
  isDraggable: boolean
}

// Using Wikipedia chess piece SVG URLs (public domain)
const pieceImages: { [key: string]: string } = {
  wP: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  wN: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  wB: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  wR: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  wQ: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
  wK: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
  bP: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
  bN: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
  bB: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  bR: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  bQ: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
  bK: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg'
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
          const rank = 8 - rankIndex
          const file = files[fileIndex]
          const square = `${file}${rank}`
          const color = char === char.toUpperCase() ? 'w' : 'b'
          const piece = char.toUpperCase()
          board[square] = `${color}${piece}`
          fileIndex++
        } else {
          fileIndex += Number(char)
        }
      }
    })

    return board
  }

  const board = parseFEN(position)
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1]

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, square: string) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', square)
    setDraggedFrom(square)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, square: string) => {
    e.preventDefault()
    setDraggedOver(square)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDraggedOver(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetSquare: string) => {
    e.preventDefault()
    e.stopPropagation()

    const sourceSquare = e.dataTransfer.getData('text/plain')

    if (!sourceSquare) {
      setDraggedFrom(null)
      setDraggedOver(null)
      return
    }

    const moveSuccessful = onPieceDrop(sourceSquare, targetSquare)

    setDraggedFrom(null)
    setDraggedOver(null)
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
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
            const canDrag = isDraggable && isPieceWhite && !!piece

            return (
              <div
                key={square}
                className={`relative flex items-center justify-center ${
                  isLight ? 'bg-[#475569]' : 'bg-[#1e293b]'
                } ${isDragSource ? 'opacity-30' : ''} ${
                  isDragTarget ? 'ring-4 ring-inset ring-blue-400' : ''
                } transition-all`}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, square)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, square)}
              >
                {piece && (
                  <div
                    draggable={canDrag}
                    onDragStart={(e) => {
                      if (!canDrag) {
                        e.preventDefault()
                        return false
                      }
                      handleDragStart(e, square)
                    }}
                    onDragEnd={handleDragEnd}
                    className={`w-[80%] h-[80%] flex items-center justify-center ${
                      canDrag ? 'cursor-grab active:cursor-grabbing hover:scale-105' : 'cursor-not-allowed opacity-70'
                    } transition-transform select-none`}
                    style={{
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none'
                    }}
                  >
                    <img
                      src={pieceImages[piece]}
                      alt={piece}
                      draggable={false}
                      className="w-full h-full object-contain pointer-events-none"
                      style={{
                        userSelect: 'none',
                        WebkitUserDrag: 'none'
                      }}
                    />
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
