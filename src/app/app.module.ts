import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  HttpClientModule,
  HttpClientXsrfModule,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
// CommonModule for dynamic field
import { APP_BASE_HREF, CommonModule } from '@angular/common';

import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ModalModule, BsDropdownModule, AccordionModule } from 'ngx-foundation';
import { MatSliderModule } from '@angular/material/slider';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { NgxMasonryModule } from 'ngx-masonry';
import { ToastrModule } from 'ngx-toastr';

import { FileSizeModule } from 'ngx-filesize';
import { ApiModule } from 'ng-tapis';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapComponent } from './components/map/map.component';
import { MainComponent } from './components/main/main.component';
import { NotFoundComponent } from './components/notfound/notfound.component';
import { ControlBarComponent } from './components/control-bar/control-bar.component';
import { AuthService } from './services/authentication.service';
import { EnvService } from './services/env.service';
import { TokenInterceptor } from './app.interceptors';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ModalFileBrowserComponent } from './components/modal-file-browser/modal-file-browser.component';
import { ImageGalleryComponent } from './components/image-gallery/image-gallery.component';
// import { TaggerComponent } from './components/tagger/tagger.component';
// import { PresetGeneratorComponent } from './components/preset-generator/preset-generator.component';
import { ImageBoxComponent } from './components/image-box/image-box.component';
import { FormGeneratorComponent } from './components/side-bar/tag-images/form-generator/form-generator.component';
import { SideBarComponent } from './components/side-bar/side-bar.component';
// import { ImageListComponent } from './components/image-list/image-list.component';
import { SelectGroupComponent } from './components/side-bar/select-group/select-group.component';
import { SelectImageComponent } from './components/side-bar/select-image/select-image.component';
import { TagGeneratorComponent } from './components/side-bar/tag-generator/tag-generator.component';
import { TagImagesComponent } from './components/side-bar/tag-images/tag-images.component';
import { ModalCreateProjectComponent } from './components/modal-create-project/modal-create-project.component';
import { ModalCurrentProjectComponent } from './components/modal-current-project/modal-current-project.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTreeModule } from '@angular/material/tree';
import { MatProgressBar } from '@angular/material';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ModalDownloadSelectorComponent } from './components/modal-download-selector/modal-download-selector.component';
import { FormFieldsComponent } from './components/side-bar/tag-images/form-generator/form-fields/form-fields.component';
import { FormCheckBoxComponent } from './components/side-bar/tag-images/form-generator/form-fields/form-checkbox/form-checkbox.component';
import { FormDropDownComponent } from './components/side-bar/tag-images/form-generator/form-fields/form-dropdown/form-dropdown.component';
import { FormFileComponent } from './components/side-bar/tag-images/form-generator/form-fields/form-file/form-file.component';
import { FormRadioComponent } from './components/side-bar/tag-images/form-generator/form-fields/form-radio/form-radio.component';
import { FormTextBoxComponent } from './components/side-bar/tag-images/form-generator/form-fields/form-textbox/form-textbox.component';
import { FormColorComponent } from './components/side-bar/tag-images/form-generator/form-fields/form-color/form-color.component';
import { ModalShareProjectComponent } from './components/modal-share-project/modal-share-project.component';
import { MatCardModule } from '@angular/material/card';
import { LogoutComponent } from './components/logout/logout.component';

const envService = new EnvService();
envService.init();

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    NotFoundComponent,
    MainComponent,
    ControlBarComponent,
    ModalFileBrowserComponent,
    ImageGalleryComponent,
    // TaggerComponent,
    // PresetGeneratorComponent,
    ImageBoxComponent,
    FormGeneratorComponent,
    SideBarComponent,
    // ImageListComponent,
    SelectGroupComponent,
    SelectImageComponent,
    TagGeneratorComponent,
    TagImagesComponent,
    ModalCreateProjectComponent,
    ModalCurrentProjectComponent,
    MatProgressBar,
    ModalDownloadSelectorComponent,
    FormFieldsComponent,
    FormCheckBoxComponent,
    FormDropDownComponent,
    FormFileComponent,
    FormRadioComponent,
    FormTextBoxComponent,
    ModalShareProjectComponent,
    FormColorComponent,
    LogoutComponent,
  ],
  imports: [
    // this is for the ng-tapis library
    ApiModule.forRoot({ rootUrl: 'https://agave.designsafe-ci.org/' }),
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    HttpClientXsrfModule.withOptions({
      cookieName: `csrftoken-${envService.env}`,
      headerName: `X-CSRFToken-${envService.env}`,
    }),
    BrowserAnimationsModule,
    InfiniteScrollModule,
    NgxSpinnerModule,
    NgxMasonryModule,
    ToastrModule.forRoot(),
    ModalModule.forRoot(),
    MatMenuModule,
    MatToolbarModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    MatRadioModule,
    MatIconModule,
    AccordionModule.forRoot(),
    ReactiveFormsModule,
    FormsModule,
    FileSizeModule,
    BsDropdownModule.forRoot(),
    CommonModule,
    MatProgressSpinnerModule,
    ScrollingModule,
    MatTreeModule,
    MatSnackBarModule,
    MatCardModule,
  ],
  providers: [
    AuthService,
    {
      provide: HTTP_INTERCEPTORS,
      multi: true,
      useClass: TokenInterceptor,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (envService: EnvService) => () => envService.init(),
      deps: [EnvService],
      multi: true,
    },
    {
      provide: APP_BASE_HREF,
      useFactory: (envService: EnvService) => {
        envService.init();
        return envService.baseHref;
      },
      deps: [EnvService],
    },
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    ModalFileBrowserComponent,
    ModalDownloadSelectorComponent,
    ModalCreateProjectComponent,
    ModalCurrentProjectComponent,
    ModalShareProjectComponent,
  ],
})
export class AppModule {}
