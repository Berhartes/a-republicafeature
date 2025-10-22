import { useEffect, useRef, useState, type ComponentType } from 'react'
import { Car, User } from 'lucide-react'

export interface NetworkGraphNode {
  id: number
  label: string
  group: string
  type?: string
  x?: number
  y?: number
  urlFoto?: string
  isTopSpender?: boolean
  fornecedorIcon?: ComponentType<any>
}

export interface NetworkGraphEdge {
  from: number
  to: number
  label?: string
}

interface NetworkGraphProps {
  nodes: NetworkGraphNode[]
  edges: NetworkGraphEdge[]
  onNodeClick?: (node: NetworkGraphNode) => void
}

export function NetworkGraph({ nodes, edges, onNodeClick }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions] = useState({ width: 800, height: 400 })
  const [processedNodes, setProcessedNodes] = useState<NetworkGraphNode[]>([])

  useEffect(() => {
    const centerX = dimensions.width / 2
    const centerY = dimensions.height / 2
    const radius = Math.min(dimensions.width, dimensions.height) * 0.3

    const nodesWithPosition = nodes.map((node, index) => {
      const angle = (index * 2 * Math.PI) / nodes.length
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      }
    })

    setProcessedNodes(nodesWithPosition)
  }, [nodes, dimensions])

  const getNodeColor = (group: string) => {
    const colors: Record<string, string> = {
      fornecedor: '#059669',
      'deputado-vip': '#3b82f6',
      'deputado-normal': '#a855f7',
      party: '#f59e0b',
      coalition: '#10b981'
    }
    return colors[group] || '#6b7280'
  }

  const getNodeById = (id: number) => processedNodes.find(n => n.id === id)

  return (
    <div className="w-full h-[400px] relative">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="border rounded-lg bg-gray-50"
      >
        {/* Desenhar arestas */}
        <g className="edges">
          {edges.map((edge, index) => {
            const fromNode = getNodeById(edge.from)
            const toNode = getNodeById(edge.to)
            
            if (!fromNode || !toNode) return null

            const midX = (fromNode.x! + toNode.x!) / 2
            const midY = (fromNode.y! + toNode.y!) / 2

            return (
              <g key={index}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke="#94a3b8"
                  strokeWidth="2"
                  className="hover:stroke-blue-500 transition-colors"
                />
                {edge.label && (
                  <text
                    x={midX}
                    y={midY}
                    textAnchor="middle"
                    className="text-xs fill-gray-600 bg-white"
                    dy="-5"
                  >
                    <tspan className="bg-white px-1">{edge.label}</tspan>
                  </text>
                )}
              </g>
            )
          })}
        </g>

        {/* Desenhar nós */}
        <g className="nodes">
          {processedNodes.map((node) => (
            <g
              key={node.id}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onNodeClick?.(node)}
            >
              {/* Círculo de fundo com cor especial para top spender */}
              <circle
                cx={node.x}
                cy={node.y}
                r="32"
                fill={node.isTopSpender ? "#FFD700" : getNodeColor(node.group)}
                stroke={node.isTopSpender ? "#FFA500" : "#fff"}
                strokeWidth={node.isTopSpender ? "4" : "3"}
                className={node.isTopSpender ? "animate-pulse" : ""}
              />
              
              {/* Foto do deputado (se disponível) */}
              {node.urlFoto ? (
                <>
                  <defs>
                    <pattern id={`photo-${node.id}`} patternUnits="userSpaceOnUse" width="60" height="60">
                      <image
                        href={node.urlFoto}
                        x="0"
                        y="0"
                        width="60"
                        height="60"
                        preserveAspectRatio="xMidYMid slice"
                      />
                    </pattern>
                    <clipPath id={`clip-${node.id}`}>
                      <circle cx="30" cy="30" r="28" />
                    </clipPath>
                  </defs>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="28"
                    fill={`url(#photo-${node.id})`}
                    clipPath={`url(#clip-${node.id})`}
                  />
                </>
              ) : (
                <>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="28"
                    fill={getNodeColor(node.group)}
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  {/* Ícone de usuário para deputados sem foto */}
                  {node.id !== 1 && (
                    <foreignObject
                      x={node.x! - 12}
                      y={node.y! - 12}
                      width="24"
                      height="24"
                    >
                      <User 
                        className="w-6 h-6 text-white" 
                        style={{ filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))' }}
                      />
                    </foreignObject>
                  )}
                </>
              )}
              
              {/* Ícone no centro para fornecedor */}
              {node.id === 1 && (
                <foreignObject
                  x={node.x! - 12}
                  y={node.y! - 12}
                  width="24"
                  height="24"
                >
                  {node.fornecedorIcon ? (
                    <node.fornecedorIcon 
                      className="w-6 h-6 text-white" 
                      style={{ filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))' }}
                    />
                  ) : (
                    <Car 
                      className="w-6 h-6 text-white" 
                      style={{ filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))' }}
                    />
                  )}
                </foreignObject>
              )}
              
              {/* Badge de top spender */}
              {node.isTopSpender && (
                <>
                  <circle
                    cx={node.x! + 22}
                    cy={node.y! - 22}
                    r="10"
                    fill="#FFD700"
                    stroke="#FFA500"
                    strokeWidth="2"
                  />
                  <text
                    x={node.x! + 22}
                    y={node.y! - 22}
                    textAnchor="middle"
                    className="text-xs font-bold fill-orange-600"
                    dy="3"
                  >
                    👑
                  </text>
                </>
              )}
              
              {/* Nome do deputado */}
              <text
                x={node.x}
                y={node.y! + 45}
                textAnchor="middle"
                className={`text-sm font-medium ${node.isTopSpender ? 'fill-orange-600 font-bold' : 'fill-gray-700'}`}
              >
                {node.label}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {/* Legenda */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg">
        <p className="text-xs font-medium mb-2">Legenda:</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#059669]"></div>
            <span className="text-xs">Fornecedor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
            <span className="text-xs">Deputado VIP (R$ 50k+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#a855f7]"></div>
            <span className="text-xs">Deputado Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FFD700]" style={{border: '1px solid #FFA500'}}></div>
            <span className="text-xs">👑 Maior Gastador</span>
          </div>
        </div>
      </div>
    </div>
  )
}
