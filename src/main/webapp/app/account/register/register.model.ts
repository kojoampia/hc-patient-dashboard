export class Registration {
  constructor(
    public login: string,
    public email: string,
    public password: string,
    public langKey: string,
    /**
     * Which surface sent this family here, or null when nobody said.
     *
     * <p>Null rather than a default, deliberately. A defaulted source would be a fact nobody stated, and it would
     * be indistinguishable in the data from a family who really did arrive from that surface — which is exactly
     * the number this field exists to make trustworthy.</p>
     */
    public source: string | null = null,
  ) {}
}
