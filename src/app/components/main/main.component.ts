import { Component, OnInit } from '@angular/core';
import { GeoDataService } from '../../services/geo-data.service';
import { ActivatedRoute, UrlSegment } from '@angular/router';
import { AuthService } from '../../services/authentication.service';
import { ProjectsService } from '../../services/projects.service';
import { BsModalService } from 'ngx-foundation';


@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
  private isPublicView = false;


  constructor(
    private route: ActivatedRoute,
    private projectsService: ProjectsService,
  ) {}

  ngOnInit() {
    this.isPublicView = this.route.snapshot.url.some(
      (segment: UrlSegment) => segment.path === 'project-public'
    );
    this.route.paramMap.subscribe(params => {
      const projectUUID = params.get('projectUUID');
      this.projectsService.setSelectedProjectUUID(projectUUID);
    });
  }
}
