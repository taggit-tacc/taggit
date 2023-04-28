import {
  Feature as GeoJSONFeature,
  GeoJsonProperties,
  Geometry,
  FeatureCollection as IFeatureCollection,
} from 'geojson';

// TODO: break these out into their own files

export interface IPointCloud {
  id: number;
  description: string;
  conversion_parameters: string;
  feature_id?: number;
  task_id?: string;
  project_id: number;
}

// export interface Group {
//   groupName: Array<string>;
//   formList: Array<any>;
//   // type: any;
// }

// export interface Group {
//   groupName: Array<string>;
//   formList: Array<any>;
//   // type: any;
// }

export interface Group {
  groupName: string;
  formList: Array<any>;
  color: string;
  // type: any;
}

export class Group implements Group {}

export interface TagGroup {
  name: string;
  id?: number;
  color?: string;
  icon?: string;
  forms?: GroupForm[];
}

export class TagGroup implements TagGroup {}

export interface GroupForm {
  id?: string;
  groupName?: string;
  label?: string;
  color?: string;
  type?: string;
  options?: Array<any>;
}

export class GroupForm implements GroupForm {}

export interface Tag {
  id?: string;
  value?: any;
}

export class Tag implements Tag {}

// NOTE: For geojson/tag
export interface TagValue {
  id: number;
  featureId?: number;
  tagId?: number;
  groupId?: string;
  value?: Array<any> | string | number;
}

export class TagValue implements TagValue {}

export class AssetFilters {
  // bbox has the following format: [sw_lng, sw_lat, ne_lng, ne_lat], the same as leaflet
  bbox: Array<number> = [];
  assetType: Set<string> = new Set<string>();

  updateAssetTypes(assetType: string) {
    this.assetType.has(assetType)
      ? this.assetType.delete(assetType)
      : this.assetType.add(assetType);
  }

  updateBBox(bbox: Array<number>): void {
    this.bbox = bbox;
  }

  toJson() {
    return {
      assetType: [...this.assetType],
      bbox: this.bbox,
    };
  }
}

export interface Project {
  description: string;
  id?: number;
  name: string;
  ds_id?: string;
  title?: string;
  uuid?: string;
  public?: boolean;
  system_file?: string;
  system_id?: string;
  system_path?: string;
  deletable?: boolean;
  deleting?: boolean;
  deletingFailed?: boolean;
}

export class Project implements Project {}

export interface ProjectRequest {
  project: Project;
  observable?: boolean;
  watch_content?: boolean;
}

export class ProjectRequest implements ProjectRequest {}

export class AuthToken {
  token: string;
  expires: Date;
  /**
   *
   * @param token : String
   * @param expires: Date
   */
  constructor(token: string, expires: Date) {
    this.token = token;
    this.expires = new Date(expires);
  }

  static fromExpiresIn(token: string, expires_in: number) {
    const expires = new Date(new Date().getTime() + expires_in * 1000);
    return new AuthToken(token, expires);
  }

  /**
   * Checks if the token is expired or not
   */
  public isExpired(): boolean {
    return new Date().getTime() > this.expires.getTime();
  }
}

export interface IFeatureAsset {
  id?: number;
  path?: string;
  uuid?: string;
  feature_id?: number;
  asset_type?: string;
  display_path?: string;
}

export class FeatureAsset implements IFeatureAsset {
  id: number;
  path: string;
  uuid: string;
  feature_id: number;
  asset_type: string;
  display_path: string;

  // TODO: Implenent this
  get assetPath(): string {
    return '';
  }
}

export interface FeatureStyles {
  // [key: string]?: string | number;
  faIcon?: string;
  color?: string;
}

export class FeatureStyles implements FeatureStyles {}

export interface Overlay {
  id: number;
  path: string;
  uuid: string;
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
  project_id: number;
  label: string;
}

interface AppGeoJSONFeature extends GeoJSONFeature {
  assets?: Array<IFeatureAsset>;
  styles?: FeatureStyles;
  project_id?: number;
  // featureType?(): String
}

export class FeatureCollection implements IFeatureCollection {
  features: Feature[];
  type: any;
}

export class Feature implements AppGeoJSONFeature {
  geometry: Geometry;
  // Taggit specific:
  // properties.taggit
  // properties.taggit.tags: Tag[]
  // properties.taggit.groups: Group[]
  properties: GeoJsonProperties;
  id?: string | number;
  type: any;
  assets?: Array<IFeatureAsset>;
  styles?: FeatureStyles;
  project_id?: number;

  constructor(f: AppGeoJSONFeature) {
    this.geometry = f.geometry;
    this.properties = f.properties;

    // NOTE: Taggit-specific
    this.properties.taggit = this.properties.taggit ? this.properties.taggit : {};
    this.properties.taggit.groups = this.properties.taggit.groups ? this.properties.taggit.groups : [];
    this.properties.taggit.tags = this.properties.taggit.tags ? this.properties.taggit.tags : [];

    this.id = f.id;
    this.type = f.type;
    this.assets = f.assets;
    this.styles = f.styles;
    this.project_id = f.project_id;
  }

  initialAsset?() {
    return this.assets[0];
  }

  featureType?(): string {
    if (this.assets && this.assets.length === 1) {
      return this.initialAsset().asset_type;
    }

    if (this.assets && this.assets.length > 1) {
      return 'collection';
    }

    if (!this.assets.length) {
      return this.geometry.type;
    }
  }

  featurePath?(): string {
    const initialAsset = this.initialAsset();
    if (initialAsset.display_path) {
      return initialAsset.display_path;
    } else if (initialAsset.path) {
      return initialAsset.path;
    } else {
      return this.id.toString();
    }
  }

  featureShortPath?(): string {
    const [initialAsset] = this.assets;
    if (initialAsset.display_path) {
      return /[^/]*$/.exec(initialAsset.display_path)[0];
    } else if (initialAsset.path) {
      const path = /[^/]*$/.exec(initialAsset.path)[0];
      return path.slice(0, 15) + '...';
    } else {
      return this.id.toString();
    }
  }
}

export interface IProjectUser {
  id: number;
  username: string;
}

export interface DesignSafeProject {
  uuid: string;
  value: any;
}

export interface DesignSafeProjectCollection {
  projects: DesignSafeProject[];
}
