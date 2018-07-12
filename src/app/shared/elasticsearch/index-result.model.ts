export class IndexResult {
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
