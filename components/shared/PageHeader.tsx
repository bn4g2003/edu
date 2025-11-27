'use client';

import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{title}</h1>
        {description && <p className="text-slate-600">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
