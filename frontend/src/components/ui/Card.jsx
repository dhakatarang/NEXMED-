import React from 'react';

const Card = ({ 
  children, 
  className = "", 
  variant = "default",
  ...props 
}) => {
  const baseStyles = "rounded-lg border bg-card text-card-foreground shadow-sm";
  
  const variants = {
    default: "border-gray-200 bg-white",
    elevated: "border-gray-200 bg-white shadow-lg",
    outlined: "border-gray-300 bg-transparent",
    filled: "border-transparent bg-gray-50",
  };

  return (
    <div 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ 
  children, 
  className = "",
  ...props 
}) => {
  return (
    <div 
      className={`flex flex-col space-y-1.5 p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardTitle = ({ 
  children, 
  className = "",
  as: Component = "h3",
  ...props 
}) => {
  return (
    <Component 
      className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

const CardDescription = ({ 
  children, 
  className = "",
  ...props 
}) => {
  return (
    <p 
      className={`text-sm text-muted-foreground ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

const CardContent = ({ 
  children, 
  className = "",
  ...props 
}) => {
  return (
    <div 
      className={`p-6 pt-0 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardFooter = ({ 
  children, 
  className = "",
  ...props 
}) => {
  return (
    <div 
      className={`flex items-center p-6 pt-0 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Export all components
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};