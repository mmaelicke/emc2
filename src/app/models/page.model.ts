
export class Page {
  id: string;
  title: string;
  identifiers: string[];
  description: string;
  variable: string;
  license: string;
  attribution: string;
  owner: string;
  coordinates: {lat: number, lon: number};
  location: string;
  created: Date;
  edited: Date;
  supplementary: {};

  constructor() {}

  from_source(source: any, id?) {
    const page = new Page();
    page.id = id;
    page.title = source.title;
    page.identifiers = source.identifiers;
    page.description = source.description;
    page.variable = source.variable;
    page.license = source.license;
    page.attribution = source.attribution;
    page.coordinates = source.coordinates;
    page.location = source.location;
    page.created = source.created;
    page.edited = source.edited;
    page.supplementary = source.supplementary;

    return page;
  }
}
