export interface EsHit {
  took: number;
  timed_out: boolean;
  _shards: any;
  hits: {
    hits: any,
    max_score: number,
    total: number
  };
}
