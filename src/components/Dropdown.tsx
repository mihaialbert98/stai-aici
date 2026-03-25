'use client';
import React from 'react';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, children, open, onToggle, align = 'left' }: DropdownProps) {
  return (
    <div className="relative">
      <div onClick={onToggle} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div
          className={`absolute top-full mt-1 z-20 min-w-[160px] rounded-xl border border-gray-200 bg-white shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
