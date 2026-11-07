import React from 'react';
import { ShopProduct } from '../../data/shopProducts';
import { ToolAccessGuard } from '../tools/ToolAccessGuard';

export interface RequirePurchaseProps {
  product: ShopProduct;
  children: React.ReactNode;
  toolTitle?: string;
  redirectUnauthorized?: boolean;
}

export const RequirePurchase: React.FC<RequirePurchaseProps> = ({ 
  product, 
  children, 
  toolTitle,
  redirectUnauthorized = false 
}) => {
  return (
    <ToolAccessGuard 
      product={product} 
      toolTitle={toolTitle} 
      redirectUnauthorized={redirectUnauthorized}
    >
      {children}
    </ToolAccessGuard>
  );
};

export default RequirePurchase;
