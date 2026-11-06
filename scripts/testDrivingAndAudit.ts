import { auditSpatialLayout } from '../src/world/spatialAuditSystem';
import { isVehicleFootprintValid, sweptMoveVehicle, BOX_OBSTACLES, CIRCLE_OBSTACLES } from '../src/world/collisionSystem';
import { ROAD_SEGMENTS, BRIDGES } from '../src/world/roadNetwork';

console.log('=== RUNNING AUTHORITATIVE SPATIAL LAYOUT AUDIT ===');
const audit = auditSpatialLayout();

console.log('Audit Valid:', audit.isValid);
console.log('Road Obstruction Count:', audit.roadObstructionCount);
console.log('Insufficient Clearance Count:', audit.insufficientClearanceCount);
console.log('Disconnected Road Count:', audit.disconnectedRoadCount);
console.log('Overlap Count:', audit.overlapCount);
console.log('3-District Connectivity:', audit.connectivity.isAllConnected);

if (audit.roadObstructionCount > 0) {
  console.error('Road Obstructions:', JSON.stringify(audit.roadCorridors.filter(r => r.isBlocked), null, 2));
}

console.log('\n=== TESTING VEHICLE DRIVING SWEEPS ACROSS ALL THREE DISTRICTS ===');

interface DriveSegmentTest {
  name: string;
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  steps: number;
}

const routes: DriveSegmentTest[] = [
  { name: 'Rural Village Main Road', startX: -140, startZ: 0, endX: -70, endZ: 0, steps: 70 },
  { name: 'Bridge 1 (Rural West River Bridge)', startX: -66, startZ: 0, endX: -42, endZ: 0, steps: 24 },
  { name: 'Modern Village West Boulevard', startX: -40, startZ: 0, endX: -16, endZ: 0, steps: 24 },
  { name: 'Modern Village East Boulevard', startX: 6, startZ: 0, endX: 36, endZ: 0, steps: 30 },
  { name: 'Bridge 2 (Grand Capital Highway Bridge)', startX: 38, startZ: 0, endX: 64, endZ: 0, steps: 26 },
  { name: 'Capital Town Gateway Highway', startX: 66, startZ: 0, endX: 92, endZ: 0, steps: 26 },
  { name: 'Capital Grand Boulevard', startX: 118, startZ: 0, endX: 156, endZ: 0, steps: 38 },
];

let allRoutesPassed = true;

routes.forEach((route) => {
  let curX = route.startX;
  let curZ = route.startZ;
  let collidedCount = 0;

  for (let s = 1; s <= route.steps; s++) {
    const t = s / route.steps;
    const targetX = route.startX + (route.endX - route.startX) * t;
    const targetZ = route.startZ + (route.endZ - route.startZ) * t;
    const yaw = Math.atan2(route.endX - route.startX, route.endZ - route.startZ);

    const stepRes = sweptMoveVehicle(curX, curZ, yaw, targetX, targetZ, [], true);
    if (stepRes.collided) {
      collidedCount++;
    }
    curX = stepRes.x;
    curZ = stepRes.z;
  }

  const reached = Math.hypot(curX - route.endX, curZ - route.endZ) < 1.0;
  console.log(`Route [${route.name}]: reached=${reached}, collidedCount=${collidedCount}, finalPos=(${curX.toFixed(2)}, ${curZ.toFixed(2)})`);
  if (!reached || collidedCount > 0) {
    allRoutesPassed = false;
  }
});

console.log(`\nOverall Driving Verification: ${allRoutesPassed ? 'PASSED (100% smooth)' : 'FAILED'}`);
if (!audit.isValid || !allRoutesPassed) {
  process.exit(1);
} else {
  console.log('ALL VERIFICATIONS PASSED WITH 0 DEFECTS!');
  process.exit(0);
}
