
export class Hit {
  private raw: any;
  _meta: {
    index: string,
    type: string,
    id: any,
    score: number,
  };
  title: string;
  identifiers: any[];
  description: string;
  license: string;
  variable: string;
  owner: string;
  attribution: string;
  coordinates: { lat: number, lon: number };
  location: string;
  created: string;
  edited: string;
  supplementary: {};

  constructor(raw: { _index: string, _type: string, _id: any, _score: number, _source: any}) {
    this.raw = raw;
    this._meta = {index: raw._index, type: raw._type, id: raw._id, score: raw._score, };
    this.title = raw._source.title;
    this.identifiers = raw._source.identifiers;
    this.description = raw._source.description;
    this.license = raw._source.license;
    this.variable = raw._source.variable;
    this.owner = raw._source.owner;
    this.attribution = raw._source.attribution;
    this.coordinates = raw._source.coordinates;
    this.location = raw._source.location;
    this.created = raw._source.created;
    this.edited = raw._source.edited;
    this.supplementary = raw._source.supplementary;
  }


  getSupplementaryAsArray() {
    const arr: {key: string, value: any}[] = [];
    for (let k in this.supplementary) {
      arr.push({key: k, value:this.supplementary[k] });
    }
    return arr;
  }
}
