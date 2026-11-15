// The builder's presets as scenes, for a script or an agent to start from.
import { PRESETS } from '../../components/animation-builder/scene';

export const GET = () =>
  new Response(JSON.stringify(PRESETS), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
