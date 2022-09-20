import { Component, OnInit } from '@angular/core';
import { GroupsService } from '../../services/groups.service';

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss'],
})
export class SideBarComponent implements OnInit {
  showTagGenerator = false;

  constructor(private groupsService: GroupsService) {}

  ngOnInit() {
    this.groupsService.showTagGenerator.subscribe((next) => {
      this.showTagGenerator = next;
    });
  }
}
