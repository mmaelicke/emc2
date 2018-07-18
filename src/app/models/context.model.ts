export class Context {
  id: string;
  name: string;
  part_of: string[];
  index: string;

  constructor(id: string, name: string, part_of: string[] = [], index?: string) {
    this.id = id;
    this.name = name;
    this.part_of = part_of;
    this.index = index;
  }
}
