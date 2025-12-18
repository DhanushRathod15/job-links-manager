import React from 'react'

interface ExampleComponentProps {
  title: string
  description?: string
}

export const ExampleComponent: React.FC<ExampleComponentProps> = ({
  title,
  description,
}) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
      {description && (
        <p className="text-gray-600">{description}</p>
      )}
    </div>
  )
}

