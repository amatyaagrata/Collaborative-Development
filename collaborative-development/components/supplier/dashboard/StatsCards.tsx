// src/components/supplier/dashboard/StatsCards.tsx
"use client";

interface StatsCardsProps {
  stats: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { title: "Total Orders", value: stats.totalOrders, color: "#3b82f6", icon: "📦", bg: "#eff6ff" },
    { title: "Pending Orders", value: stats.pendingOrders, color: "#f59e0b", icon: "⏳", bg: "#fffbeb" },
    { title: "Completed", value: stats.completedOrders, color: "#10b981", icon: "✅", bg: "#ecfdf5" },
  ];

  return (
    <div className="stats-cards">
      {cards.map((card) => (
        <div key={card.title} className="stat-card" style={{ backgroundColor: card.bg }}>
          <div className="stat-icon" style={{ color: card.color }}>{card.icon}</div>
          <div className="stat-info">
            <h3>{card.title}</h3>
            <p className="stat-value" style={{ color: card.color }}>{card.value}</p>
          </div>
        </div>
      ))}

      <style jsx>{`
        .stats-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }
        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .stat-icon {
          font-size: 36px;
        }
        .stat-info {
          flex: 1;
        }
        .stat-info h3 {
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
        }
        @media (max-width: 768px) {
          .stats-cards {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .stat-value {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}