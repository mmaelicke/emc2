import {tileLayer} from 'leaflet';

export class MaplayersService {
  attribution = 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under ' +
    '<a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>,'+
    ' under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>';

  layer = {
    terrain: tileLayer('http://{s}tile.stamen.com/terrain/{z}/{x}/{y}.png', {
      subdomains: ['', 'a.', 'b.', 'c.', 'd.'],
      maxZoom: 20,
      detectRetina: true,
      attribution: this.attribution
    }),

    toner: tileLayer('http://{s}tile.stamen.com/toner/{z}/{x}/{y}.png', {
      subdomains: ['', 'a.', 'b.', 'c.', 'd.'],
      maxZoom: 20,
      detectRetina: true,
      attribution: this.attribution
    })
  };

  getLayers() {
    return [this.layer.terrain, this.layer.toner].slice();
  }

}
