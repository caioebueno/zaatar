# Dispatch Assignment Logic

This document explains how the system decides:

1. which dispatch receives a new delivery order
2. which driver is auto-assigned to a dispatch

## Overview

When a DELIVERY order is created with an address:

1. a `DispatchAssignmentJob` is enqueued with `orderId` and `deliveryAddressId`
2. job processor runs `assignDeliveryOrderToDispatchUseCase`
3. the use case tries to place the order in an existing open dispatch
4. if no match is found, it creates a new dispatch
5. after assignment, it auto-assigns a driver (if possible)
6. route metrics refresh is scheduled asynchronously

## Order Position Inside Dispatch

Each order can have `dispatchOrderIndex` (1-based) to represent its position inside a dispatch.

- when an order is appended to an existing dispatch, it receives `max(dispatchOrderIndex) + 1`
- when dispatch orders are replaced through dispatch update flows, indexes are rewritten in the exact order sent by `orderIds`
- when an order is removed from a dispatch, its `dispatchOrderIndex` is cleared (`null`)

## Existing Dispatch vs New Dispatch

The decision happens in `assignDeliveryOrderToDispatchUseCase`.

### Rule 1: try to match an existing open dispatch first

Repository method: `findMatchingOpenDispatchForDeliveryAddress(deliveryAddressId, maxRouteDurationInMinutes)`.

Current `maxRouteDurationInMinutes` is `10`.

Candidate dispatches must satisfy all conditions:

- dispatch is not dispatched yet (`dispatch.dispatched = false`)
- has at least one undelivered order (`orders.deliveredAt IS NULL`)
- orders have a delivery address
- total number of orders in the dispatch is less than `3`

### Rule 2: choose the best existing dispatch by added route cost

For each candidate dispatch:

1. collect its active stops (delivery addresses with undelivered orders)
2. add the new order's stop
3. run route optimization
4. compute:
   - direct target trip duration: store -> new address
   - optimized delivery duration with merged dispatch
   - `addedWholeTripDurationInMinutes = optimizedDeliveryDuration - directTargetTripDuration`

Candidate is rejected if:

- `addedWholeTripDurationInMinutes > 10`

Best match is chosen by these tie-breakers, in order:

1. lowest `addedWholeTripDurationInMinutes`
2. lowest total delivery duration
3. lowest round-trip duration

### Rule 3: create a new dispatch if no candidate qualifies

If no existing dispatch passes the constraints above:

- create a new dispatch (`dispatched = false`)
- assign the order to it

## Driver Auto-Assignment Logic

After order assignment (existing or new dispatch), `autoAssignDriver(dispatchId)` runs.

### Preconditions

- if dispatch does not exist: throws `NOT_FOUND`
- if dispatch already has a driver: keep current driver and exit

### Active driver pool

Load all active drivers sorted by:

1. `priorityLevel` ascending
2. `createdAt` ascending

### Busy driver detection

A driver is considered busy when they already have another dispatch with at least one undelivered order.

For busy drivers, the system keeps the "least costly" current dispatch using:

1. lowest `estimatedRoundTripDurationMinutes` (null treated as very large)
2. oldest dispatch `createdAt`

### Driver selection strategy

1. Prefer a free active driver (not in busy list), using active-driver order:
   - lowest `priorityLevel`
   - oldest `createdAt`
2. If all active drivers are busy, choose from busy drivers by:
   - lowest `estimatedRoundTripDurationMinutes`
   - lowest `priorityLevel`
   - oldest driver `createdAt`

If no active drivers are available, dispatch remains without driver.

## Route Metrics Refresh

After assignment, route metrics refresh is scheduled in a microtask:

- `estimatedDeliveryDurationMinutes`
- `estimatedRoundTripDurationMinutes`

Metrics are recalculated from undelivered stops only.

## Queue and Retry Behavior

Assignment runs through `DispatchAssignmentJob` queue:

- claim jobs in `PENDING` or `FAILED` with `availableAt <= now`
- mark as `PROCESSING`, increment attempts
- on success: mark `COMPLETED`
- on failure: mark `FAILED`, retry later with exponential backoff

Backoff:

- starts at 30 seconds
- doubles each attempt
- capped at 15 minutes
