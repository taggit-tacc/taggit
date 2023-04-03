import { Component, OnInit } from '@angular/core';
import { GroupsService } from '../../services/groups.service';
import { GeoDataService } from '../../services/geo-data.service';

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss'],
})
export class SideBarComponent implements OnInit {
  showTagGenerator = false;
  loadingFeatureProperties;

  constructor(
    private groupsService: GroupsService,
    private geoDataService: GeoDataService
  ) { }

  ngOnInit() {
    this.groupsService.showTagGenerator.subscribe((next) => {
      this.showTagGenerator = next;
    });

    this.geoDataService.loadingFeatureProperties.subscribe((next) => {
      this.loadingFeatureProperties = next;
    });
  }
}
