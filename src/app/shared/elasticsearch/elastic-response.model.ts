export class IndexResponse {
  _shards: {
    total: number,
    failed: number,
    successful: number
  };
  _index: string;
  _type: string;
  _id: string;
  _version: number;
  _seq_no: number;
  _primary_term: number;
  result: string;
}

export interface Variables {
  name: string;
  count: number;
}

// TODO this can be specified
export interface SearchResponse {
  took: number;
  timed_out: boolean;
  _shards: any;
  hits: {
    hits: any,
    max_score: number,
    total: number
  };
}
