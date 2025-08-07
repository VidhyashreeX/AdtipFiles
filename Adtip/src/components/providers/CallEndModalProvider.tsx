import React, { useEffect, useState } from 'react';
import CallEndModal from '../modals/CallEndModal';
import CallEndModalService, { CallEndModalData } from '../../services/calling/CallEndModalService';

interface CallEndModalProviderProps {
  children: React.ReactNode;
}

const CallEndModalProvider: React.FC<CallEndModalProviderProps> = ({ children }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<CallEndModalData | null>(null);

  useEffect(() => {
    const callEndModalService = CallEndModalService.getInstance();

    const handleShowModal = (data: CallEndModalData) => {
      console.log('[CallEndModalProvider] Received show modal event', data);
      setModalData(data);
      setModalVisible(true);
    };

    // Listen for modal events
    callEndModalService.on('showCallEndModal', handleShowModal);

    // Cleanup listener on unmount
    return () => {
      callEndModalService.off('showCallEndModal', handleShowModal);
    };
  }, []);

  const handleCloseModal = () => {
    console.log('[CallEndModalProvider] Closing call end modal');
    setModalVisible(false);
    setModalData(null);
  };

  return (
    <>
      {children}
      {modalData && (
        <CallEndModal
          visible={modalVisible}
          onClose={handleCloseModal}
          callType={modalData.callType}
          isCallInitiator={modalData.isCallInitiator}
          amount={modalData.amount}
          duration={modalData.duration}
          callerName={modalData.callerName}
          receiverName={modalData.receiverName}
        />
      )}
    </>
  );
};

export default CallEndModalProvider;
