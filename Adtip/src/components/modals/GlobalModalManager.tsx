// src/components/modals/GlobalModalManager.tsx
import React, { useState, useEffect } from 'react';
import CallSettlementModal from './CallSettlementModal';
import SettlementModalService, { SettlementModalData } from '../../services/SettlementModalService';

/**
 * Global modal manager that handles app-wide modals
 * This component should be placed at the root level of the app
 */
const GlobalModalManager: React.FC = () => {
  const [settlementModalData, setSettlementModalData] = useState<SettlementModalData | null>(null);
  const [isSettlementModalVisible, setIsSettlementModalVisible] = useState(false);

  useEffect(() => {
    const settlementModalService = SettlementModalService.getInstance();

    // Subscribe to settlement modal events
    const unsubscribeShow = settlementModalService.onShowSettlementModal((data: SettlementModalData) => {
      console.log('[GlobalModalManager] Received settlement modal data:', data);
      setSettlementModalData(data);
      setIsSettlementModalVisible(true);
    });

    const unsubscribeHide = settlementModalService.onHideSettlementModal(() => {
      console.log('[GlobalModalManager] Hiding settlement modal');
      setIsSettlementModalVisible(false);
      // Clear data after a delay to allow for exit animation
      setTimeout(() => {
        setSettlementModalData(null);
      }, 300);
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeShow();
      unsubscribeHide();
    };
  }, []);

  const handleCloseSettlementModal = () => {
    setIsSettlementModalVisible(false);
    // Clear data after a delay to allow for exit animation
    setTimeout(() => {
      setSettlementModalData(null);
    }, 300);
  };

  return (
    <>
      {/* Call Settlement Modal */}
      <CallSettlementModal
        visible={isSettlementModalVisible}
        onClose={handleCloseSettlementModal}
        settlementData={settlementModalData?.settlementData || null}
        currentUserId={settlementModalData?.currentUserId || ''}
        otherUserName={settlementModalData?.otherUserName}
        otherUserId={settlementModalData?.otherUserId}
      />
      
      {/* Add other global modals here as needed */}
    </>
  );
};

export default GlobalModalManager;
