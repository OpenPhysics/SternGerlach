/**
 * sternGerlachQueryParameters.ts
 *
 * Sim-specific startup query parameters. This is the single place where every
 * sim-specific query parameter is declared and documented. Public-facing
 * parameters (intended for end users / sharing links) must set `public: true`.
 *
 * ── How to add a query parameter ──────────────────────────────────────────────
 * 1. Add an entry below with a `type`, `defaultValue`, and (if user-facing)
 *    `public: true`. Add `isValidValue` to bound numeric ranges.
 * 2. If it should also be user-editable at runtime, surface it as a preference
 *    in SternGerlachPreferencesModel (initialize that Property from this query parameter).
 *
 * Usage: append e.g. `?exampleToggle=true` to the sim URL.
 */

import { logGlobal } from "scenerystack/phet-core";
import { QueryStringMachine } from "scenerystack/query-string-machine";
import SternGerlachNamespace from "../SternGerlachNamespace.js";

const sternGerlachQueryParameters = QueryStringMachine.getAll({
  /**
   * Enables Spin 1 as a second quantum-system choice (next to spin-½). Off by
   * default; also toggleable at runtime in Preferences → Simulation. When off,
   * the sim stays on spin-½ and hides the system radio group.
   */
  spinOne: {
    type: "boolean",
    defaultValue: false,
    public: true,
  },

  /**
   * Enables the SU(3) (Gell-Mann λ₁-λ₈) quantum system as an additional choice.
   * Off by default; also toggleable at runtime in Preferences → Simulation.
   */
  su3: {
    type: "boolean",
    defaultValue: false,
    public: true,
  },
});

SternGerlachNamespace.register("sternGerlachQueryParameters", sternGerlachQueryParameters);

// Log query parameters (for the console / PhET-iO).
logGlobal("phet.chipper.queryParameters");

export default sternGerlachQueryParameters;
