import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chromium } from 'playwright';

const base = process.env.ROOMLY_TEST_URL ?? 'http://localhost:3000';
const today = new Date('2027-01-11T03:00:00Z');
const checkIn = '2027-01-11';
const secondNight = '2027-01-12';
const checkOut = '2027-01-13';
const user = { userId: 7, email: 'guest@roomly.test', fullName: 'Rani Test', role: 'CUSTOMER' };
const receptionist = { userId: 8, email: 'desk@roomly.test', fullName: 'Resepsionis Test', role: 'RECEPTIONIST', hotelId: 1 };
const administrator = { userId: 9, email: 'admin@roomly.test', fullName: 'Admin Test', role: 'ADMIN' };
const room = { id: 6, hotelId: 1, roomName: 'Presidential Suite', basePrice: 35000000, totalBeds: 4, maxOccupancy: 6 };
const hotel = { id: 1, name: 'Hotel Mulia Senayan Jakarta', city: 'Jakarta', country: 'Indonesia', thumbnailUrl: '/images/seed/rooms/suite-1.jpg' };
const dates = { roomId: 6, checkInDate: checkIn, checkOutDate: checkOut };
const empty = { content: [], number: 0, totalPages: 0, totalElements: 0 };

async function fixture(t, { width = 390, startPath = '/booking/1/6', actor = user, booking = null } = {}) {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width, height: 844 }, timezoneId: 'Asia/Jakarta', reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const state = {
    amount: 74000000, quoteFailed: false, priceChanged: false, paymentStatus: 'PENDING',
    bookingPosts: [], paymentPosts: [], syncCalls: 0, actor, booking, checkOutCalls: 0, checkOutFailed: false,
  };
  const sandboxUrl = new URL('/__checkout-payment-test', base).href;
  const holdExpiresAt = new Date(today.getTime() + 15000).toISOString();

  await context.route(url => url.href === sandboxUrl, route => route.fulfill({ contentType: 'text/html', body: '<h1>Pembayaran uji</h1>' }));
  await context.route(url => url.origin !== new URL(base).origin, route => route.abort());
  await context.route(url => /-service\/api\//.test(url.pathname), async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    const ok = (data, status = 200) => route.fulfill({ status, json: { data } });

    if (path.endsWith('/auth/me')) return ok(state.actor);
    if (path.endsWith('/hotels/1')) return ok(hotel);
    if (path.endsWith('/rooms/6')) return ok(room);
    if (path.endsWith('/rooms/6/images')) return ok([{ imageUrl: hotel.thumbnailUrl, isPrimary: true }]);
    if (path.endsWith('/rooms/6/availability')) return ok([checkIn, secondNight, checkOut].map(availabilityDate => ({
      availabilityDate, status: 'AVAILABLE', availableInventory: 2, totalInventory: 2,
    })));
    if (path.endsWith('/hotels') || path.endsWith('/rooms') || path.endsWith('/notifications')) return ok(empty);
    if (path.endsWith('/unread-count')) return ok({ unreadCount: 0 });

    if (path.endsWith('/bookings/quote')) {
      assert.deepEqual(request.postDataJSON(), dates);
      if (state.quoteFailed) return route.fulfill({ status: 503 });
      return ok({
        totalAmount: state.amount, subtotalAmount: state.amount, taxAmount: 0, serviceFeeAmount: 0, discountAmount: 0, currency: 'IDR',
        nights: [{ stayDate: checkIn, pricePerNight: 35000000 }, { stayDate: secondNight, pricePerNight: state.amount - 35000000 }],
      });
    }
    if (path.endsWith('/api/bookings') && method === 'POST') {
      const body = request.postDataJSON();
      state.bookingPosts.push(body);
      if (state.priceChanged) {
        state.priceChanged = false;
        state.amount = 76000000;
        return route.fulfill({ status: 409, json: { message: 'Price changed', errors: { expectedTotalAmount: 'PRICE_CHANGED' } } });
      }
      state.booking = {
        ...dates, id: 42, userId: user.userId, hotelId: 1, bookingCode: 'BK-TEST', status: 'PENDING', paymentStatus: 'UNPAID',
        adultCount: body.adultCount, childCount: body.childCount, guests: body.guests, nightsCount: 2, nights: [],
        totalAmount: state.amount, subtotalAmount: state.amount, taxAmount: 0, serviceFeeAmount: 0, discountAmount: 0,
        currency: 'IDR', holdExpiresAt, roomName: room.roomName, hotelName: hotel.name,
        checkInTime: '16:45:00', checkOutTime: '11:30',
      };
      return ok(state.booking, 201);
    }
    if (path.endsWith('/bookings/me')) return ok(state.booking ? [state.booking] : []);
    if (path.endsWith('/bookings/42')) return ok(state.booking);
    if (path.endsWith('/bookings/code/BK-TEST') && state.actor.role === 'RECEPTIONIST') return ok(state.booking);
    if (path.endsWith('/rooms/6/units') && state.actor.role === 'RECEPTIONIST') {
      return ok([{ id: 601, roomId: 6, roomNumber: '601', status: 'AVAILABLE' }]);
    }
    if (path.endsWith('/bookings/42/check-in') && state.actor.role === 'RECEPTIONIST') {
      assert.deepEqual(request.postDataJSON(), { assignedRoomUnitId: 601 });
      assert.equal(state.booking.status, 'CONFIRMED');
      state.booking.status = 'CHECKED_IN';
      return ok(state.booking);
    }
    if (state.actor.role === 'ADMIN') {
      if (path.endsWith('/api/admin/bookings') && method === 'GET') return ok(state.booking ? [state.booking] : []);
      if (path.endsWith('/api/admin/bookings/42/check-out') && method === 'POST') {
        state.checkOutCalls += 1;
        assert.equal(state.booking.status, 'CHECKED_IN');
        if (state.checkOutFailed) {
          return route.fulfill({ status: 400, json: { message: 'Kamar belum dapat dilepas.' } });
        }
        state.booking = { ...state.booking, status: 'CHECKED_OUT', checkedOutAt: `${checkOut}T11:45:00` };
        return ok(state.booking);
      }
      if (path.endsWith('/rooms/inventory-summary')) {
        const checkedOut = state.booking?.status === 'CHECKED_OUT';
        return ok({
          totalUnits: 1, availableUnits: 0, occupiedUnits: checkedOut ? 0 : 1, reservedUnits: 0,
          outOfServiceUnits: 0, housekeepingUnits: checkedOut ? 1 : 0, roomTypesWithUnits: 1,
        });
      }
    }
    if (path.endsWith('/api/invoices') || path.endsWith('/api/invoices/booking/42')) {
      const invoice = state.booking?.paymentStatus === 'PAID' ? {
        ...state.booking, id: 71, bookingId: 42, invoiceNumber: 'INV-TEST', invoiceDate: checkIn, issuedAt: today.toISOString(),
        customerName: user.fullName, customerEmail: user.email, status: 'ISSUED', items: [],
      } : null;
      if (path.endsWith('/booking/42')) return invoice ? ok(invoice) : route.fulfill({ status: 404 });
      return ok(invoice ? { ...empty, content: [invoice], totalPages: 1, totalElements: 1 } : empty);
    }
    if (path.endsWith('/api/payments') && method === 'POST') {
      state.paymentPosts.push(request.postDataJSON());
      state.paymentStatus = 'PENDING';
      return ok({ paymentId: 19, status: 'PENDING', redirectUrl: sandboxUrl }, 201);
    }
    const returnPayment = {
      id: 19, bookingId: 42, bookingCode: 'BK-TEST', amount: state.amount, currency: 'IDR',
      paidAt: today.toISOString(), redirectUrl: sandboxUrl,
    };
    if (path.endsWith('/payments/order/PAY-TEST')) return ok({ ...returnPayment, status: 'PENDING' });
    if (path.endsWith('/payments/19/sync-status')) {
      state.syncCalls += 1;
      if (state.paymentStatus === 'PAID' && state.booking) {
        state.booking.status = 'CONFIRMED';
        state.booking.paymentStatus = 'PAID';
        state.booking.holdExpiresAt = null;
      } else if (state.paymentStatus === 'FAILED' && state.booking) {
        state.booking.paymentStatus = 'FAILED';
      }
      return ok({ ...returnPayment, status: state.paymentStatus });
    }
    if (path.endsWith('/payments/booking/42')) {
      return ok({ id: 19, bookingId: 42, status: state.paymentStatus, amount: state.amount, currency: 'IDR' });
    }
    if (method !== 'GET') return route.abort();
    return ok([]);
  });

  await page.clock.setFixedTime(today);
  await page.addInitScript(() => localStorage.setItem('roomly_has_active_session', 'true'));
  await page.goto(new URL(startPath, base).href);
  return { context, page, state, holdExpiresAt };
}

const next = page => page.getByRole('button', { name: 'Lanjutkan', exact: true });
const confirm = page => page.getByRole('button', { name: 'Konfirmasi & bayar', exact: true });
const total = page => page.locator('[data-checkout-quote-total]');
const currencyIs = (text, amount) => assert.equal(text.replace(/\s/g, ''), `Rp${amount}`);

async function reachReview(page) {
  const calendar = page.locator('[data-checkout-calendar]');
  await calendar.getByRole('button', { name: 'Senin, 11 Januari 2027, tersedia', exact: true }).click();
  assert.equal(await next(page).isDisabled(), true);
  await calendar.getByRole('button', { name: 'Rabu, 13 Januari 2027, tersedia', exact: true }).click();
  await next(page).click();
  const phone = page.getByLabel('Nomor telepon');
  await phone.fill('081234567890');
  await next(page).click();
  assert.equal(await phone.getAttribute('aria-invalid'), 'true');
  await phone.fill('+62 812 3456 7890');
  await next(page).click();
  await page.getByRole('heading', { name: 'Tinjau & bayar', exact: true }).waitFor();
}

test('checkout requires a fresh price before creating a booking', async t => {
  const { page, context, state } = await fixture(t, { width: 1440 });
  state.priceChanged = true;
  await reachReview(page);
  currencyIs(await total(page).innerText(), '74.000.000');
  await page.getByText('Rp 39.000.000', { exact: true }).waitFor();
  assert.equal(state.bookingPosts.length, 0);
  await confirm(page).click();
  await page.getByRole('alert').filter({ hasText: /Tarif berubah/ }).waitFor();
  await total(page).filter({ hasText: /76\.000\.000/ }).waitFor();
  assert.equal(state.paymentPosts.length, 0);
  const [popup] = await Promise.all([context.waitForEvent('page'), confirm(page).click()]);
  await popup.getByRole('heading', { name: 'Pembayaran uji' }).waitFor();
  await page.locator('[data-payment-status=PENDING]').waitFor();
  assert.deepEqual(state.bookingPosts.map(post => post.expectedTotalAmount), [74000000, 76000000]);
  assert.equal(state.bookingPosts[1].guests[0].phone, '+6281234567890');
  assert.equal(state.paymentPosts.length, 1);
  assert.equal(state.paymentPosts[0].amount, 76000000);
});

test('retrying a failed payment keeps the original booking', async t => {
  const { page, state } = await fixture(t);
  await reachReview(page);
  await confirm(page).click();
  await page.locator('[data-payment-status=PENDING]').waitFor();
  state.paymentStatus = 'FAILED';
  await page.getByRole('button', { name: 'Saya sudah bayar, cek sekarang' }).click();
  const failed = page.getByRole('dialog', { name: 'Pembayaran gagal' });
  await failed.waitFor();
  await failed.getByRole('button', { name: 'Tutup hasil pembayaran' }).click();
  await page.getByRole('button', { name: 'Coba pembayaran baru' }).click();
  await page.locator('[data-payment-status=PENDING]').waitFor();
  assert.equal(state.bookingPosts.length, 1);
  assert.deepEqual(state.paymentPosts.map(payment => payment.bookingId), [42, 42]);
});

test('loading a failed quote again makes the confirm button available', async t => {
  const { page, state } = await fixture(t);
  state.quoteFailed = true;
  await reachReview(page);
  await page.getByRole('alert').filter({ hasText: 'Tarif belum dapat dimuat.' }).waitFor();
  assert.equal(await confirm(page).isDisabled(), true);
  state.quoteFailed = false;
  await page.getByRole('button', { name: 'Muat ulang tarif' }).click();
  currencyIs(await total(page).innerText(), '74.000.000');
  assert.equal(await confirm(page).isEnabled(), true);
  assert.equal(state.bookingPosts.length, 0);
});

test('after the countdown ends, the gateway status controls when dates can be reselected', async t => {
  const { page, state, holdExpiresAt } = await fixture(t);
  await reachReview(page);
  await confirm(page).click();
  const hold = page.locator('[data-payment-hold]');
  assert.equal(await hold.getByRole('timer').innerText(), '00:15');
  await page.getByRole('button', { name: 'Buka halaman pembayaran' }).waitFor();
  await page.clock.setFixedTime(new Date(Date.parse(holdExpiresAt) + 1000));
  await hold.getByText('Waktu penahanan kamar berakhir').waitFor();
  assert.equal(await hold.getByRole('timer').innerText(), '00:00');
  assert.equal(await page.getByRole('button', { name: 'Buka halaman pembayaran' }).count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Pilih tanggal lagi' }).count(), 0);
  state.paymentStatus = 'EXPIRED';
  await page.getByRole('button', { name: 'Saya sudah bayar, cek sekarang' }).click();
  const expired = page.getByRole('dialog', { name: 'Pembayaran kedaluwarsa' });
  await expired.waitFor();
  await page.keyboard.press('Escape');
  assert.ok(state.syncCalls > 0);
  await page.getByRole('button', { name: 'Pilih tanggal lagi' }).click();
  await page.getByRole('heading', { name: 'Kapan kamu menginap?' }).waitFor();
  assert.equal(await next(page).isDisabled(), true);
  assert.equal(state.bookingPosts.length, 1);
});

test('a settled payment is visible to the customer and can be checked in by reception', async t => {
  const { page, state } = await fixture(t);
  await reachReview(page);
  await confirm(page).click();
  await page.locator('[data-payment-status=PENDING]').waitFor();
  state.paymentStatus = 'PAID';
  await page.getByRole('button', { name: 'Saya sudah bayar, cek sekarang' }).click();
  await page.getByRole('dialog', { name: 'Pembayaran berhasil' }).getByRole('button', { name: 'Lihat pesanan', exact: true }).click();
  const customerBooking = page.locator('[data-booking-id="42"]');
  await customerBooking.getByText('Mulai 16:45', { exact: true }).waitFor();
  await customerBooking.getByText('Paling lambat 11:30', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Invoice', exact: true }).click();
  await page.getByRole('dialog').getByText('INV-TEST', { exact: true }).waitFor();

  state.actor = receptionist;
  await page.goto(new URL('/staff/check-in', base).href);
  await page.getByLabel('Kode reservasi').fill('BK-TEST');
  await page.getByRole('button', { name: 'Cari', exact: true }).click();
  const deskReservation = page.getByRole('region', { name: 'Tamu utama', exact: true });
  await deskReservation.getByText('Mulai 16:45', { exact: true }).waitFor();
  await deskReservation.getByText('Paling lambat 11:30', { exact: true }).waitFor();
  const checkInAction = page.getByRole('button', { name: 'Konfirmasi check-in', exact: true });
  await checkInAction.waitFor();
  assert.equal(await checkInAction.isDisabled(), true);
  await page.getByText('601', { exact: true }).click();
  await checkInAction.click();
  await page.getByRole('heading', { name: 'Check-in berhasil' }).waitFor();
  assert.equal(state.booking.status, 'CHECKED_IN');
});

test('a Midtrans return verifies the order and opens the paid modal', async t => {
  const { page, state } = await fixture(t, { width: 320 });
  await page.goto(new URL('/bookings?paymentOrder=PAY-TEST&status_code=200&transaction_status=settlement', base).href);
  const pending = page.getByRole('dialog', { name: 'Menunggu konfirmasi pembayaran' });
  await pending.getByRole('button', { name: 'Periksa status lagi' }).waitFor();
  assert.equal(await page.getByRole('dialog', { name: 'Pembayaran berhasil' }).count(), 0);

  state.paymentStatus = 'PAID';
  await pending.getByRole('button', { name: 'Periksa status lagi' }).click();
  const paid = page.getByRole('dialog', { name: 'Pembayaran berhasil' });
  await paid.getByText('BK-TEST').waitFor();
  currencyIs(await paid.locator('dd').last().innerText(), '74.000.000');
  assert.equal(await paid.evaluate(dialog => dialog.scrollWidth <= dialog.clientWidth), true);
  await paid.getByRole('button', { name: 'Lihat pesanan', exact: true }).click();
  await page.waitForURL(new URL('/bookings', base).href);
  await paid.waitFor({ state: 'hidden' });
});

test('a legacy Midtrans return shows verified failure and can go home', async t => {
  const { page, state } = await fixture(t, { width: 1440 });
  state.paymentStatus = 'FAILED';
  await page.goto(new URL('/bookings?order_id=PAY-TEST&transaction_status=settlement', base).href);
  const failed = page.getByRole('dialog', { name: 'Pembayaran gagal' });
  await failed.getByRole('link', { name: 'Kembali ke beranda' }).click();
  await page.waitForURL(new URL('/', base).href);
  await failed.waitFor({ state: 'hidden' });
});

for (const width of [320, 1440]) {
  test(`admin check-out requires confirmation and reports the saved result at ${width}px`, async t => {
    const booking = {
      ...dates, id: 42, userId: user.userId, hotelId: hotel.id, bookingCode: 'BK-TEST',
      status: 'CHECKED_IN', paymentStatus: 'PAID', nightsCount: 2, totalAmount: 74000000,
      adultCount: 1, childCount: 0, hotelName: hotel.name, roomName: room.roomName,
      checkInTime: '16:45', checkOutTime: '11:30', assignedRoomUnitId: 601,
      guests: [{ fullName: user.fullName, email: user.email, isPrimaryGuest: true }],
    };
    const { page, state } = await fixture(t, { width, startPath: '/admin', actor: administrator, booking });
    const reservations = page.getByRole('region', { name: 'Daftar reservasi' });
    const filter = reservations.getByRole('combobox', { name: 'Filter status reservasi' });
    await filter.selectOption('checked-in');
    const action = reservations.getByRole('button', { name: 'Check-out', exact: true });
    const dialog = page.getByRole('dialog', { name: 'Konfirmasi check-out' });

    await action.click();
    await dialog.getByText('BK-TEST', { exact: true }).waitFor();
    await dialog.getByText(user.fullName, { exact: true }).waitFor();
    await dialog.getByText(room.roomName, { exact: true }).waitFor();
    await dialog.getByText('Paling lambat 11:30', { exact: true }).waitFor();
    assert.equal(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth), true);
    await dialog.getByRole('button', { name: 'Kembali', exact: true }).click();
    assert.equal(state.checkOutCalls, 0);

    await action.click();
    const submit = dialog.getByRole('button', { name: 'Konfirmasi check-out', exact: true });
    state.checkOutFailed = true;
    await submit.click();
    await dialog.getByRole('alert').filter({ hasText: 'Kamar belum dapat dilepas.' }).waitFor();
    assert.equal(state.booking.status, 'CHECKED_IN');
    state.checkOutFailed = false;
    await submit.click();

    const completed = page.getByRole('dialog', { name: 'Check-out berhasil' });
    await completed.getByRole('status').filter({ hasText: 'Reservasi berstatus Selesai.' }).waitFor();
    await completed.getByText('Kamar ditandai perlu dibersihkan.', { exact: true }).waitFor();
    assert.equal(await completed.locator('time').first().getAttribute('datetime'), `${checkOut}T11:45:00`);
    assert.equal(state.checkOutCalls, 2);
    await completed.getByRole('button', { name: 'Selesai', exact: true }).click();
    assert.equal(await filter.evaluate(element => element === document.activeElement), true);
    assert.equal(await action.count(), 0);

    await filter.selectOption('completed');
    await reservations.getByText('Selesai', { exact: true }).filter({ visible: true }).waitFor();
    assert.equal(await action.count(), 0);
  });
}
