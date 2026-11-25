import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { paymentApi } from '../../api/payments';
import { ApiError } from '../../lib/http';
import type { PaymentResponse } from '../../types/api';
import { PaymentResultDialog } from './PaymentResultDialog';

const returnParameters = ['paymentOrder', 'order_id', 'transaction_status', 'status_code'];

export function getPaymentReturnOrder(search: string) {
  const params = new URLSearchParams(search);
  const orderId = params.get('paymentOrder') || params.get('order_id');
  return orderId && /^[a-zA-Z0-9_-]{1,100}$/.test(orderId) ? orderId : null;
}

interface PaymentReturnFeedbackProps {
  orderId: string;
  isID: boolean;
  onStatusChanged: () => void | Promise<void>;
}

export function PaymentReturnFeedback({ orderId, isID, onStatusChanged }: PaymentReturnFeedbackProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(0);
  const [payment, setPayment] = useState<PaymentResponse>();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<'retryable' | 'missing' | null>(null);

  useEffect(() => {
    let active = true;

    const verify = async () => {
      try {
        const current = await paymentApi.getByOrderId(orderId);
        if (!active) return;
        setPayment(current);
        const latest = current.status === 'PENDING' ? await paymentApi.syncStatus(current.id) : current;
        if (!active) return;
        setPayment(latest);
        if (latest.status !== 'PENDING') void onStatusChanged();
      } catch (err) {
        if (!active) return;
        const unavailable = err instanceof ApiError && (err.status === 403 || err.status === 404);
        setError(unavailable ? 'missing' : 'retryable');
      } finally {
        if (active) setChecking(false);
      }
    };

    void verify();
    return () => { active = false; };
  }, [attempt, orderId, onStatusChanged]);

  const dismiss = () => {
    const params = new URLSearchParams(location.search);
    returnParameters.forEach(param => params.delete(param));
    navigate({ pathname: location.pathname, search: params.toString(), hash: location.hash }, { replace: true });
  };

  const canCheck = payment?.status === 'PENDING' || error === 'retryable';
  return (
    <PaymentResultDialog
      isID={isID}
      result={error ? 'UNAVAILABLE' : payment?.status ?? 'CHECKING'}
      summary={error === 'missing' ? undefined : payment}
      isChecking={checking}
      onCheck={canCheck && error !== 'missing' ? () => {
        setError(null);
        setChecking(true);
        setAttempt(value => value + 1);
      } : undefined}
      onDismiss={dismiss}
      onViewBookings={() => navigate('/bookings', { replace: true })}
    />
  );
}
