import {Feature as GeoJSONFeature,
  GeoJsonProperties,
  Geometry,
  FeatureCollection as IFeatureCollection } from 'geojson';


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

export class Group implements Group {

}


export class AssetFilters {

  // bbox has the following format: [sw_lng, sw_lat, ne_lng, ne_lat], the same as leaflet
  bbox: Array<number> = [];
  assetType: Set<string> = new Set<string>();

  updateAssetTypes(assetType: string) {
	this.assetType.has(assetType) ? this.assetType.delete(assetType) : this.assetType.add(assetType);
  }

  updateBBox(bbox: Array<number>): void {
	this.bbox = bbox;
  }

  toJson() {
	return {
	  assetType: [...this.assetType],
	  bbox: this.bbox
	};
  }

}


export interface Project {
  description: string;
  id?: number;
  name: string;
  uuid?: string;
}

export class Project implements Project {

}

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
  id: number;
  path: string;
  uuid: string;
  feature_id: number;
  asset_type: string;
  assetPath: string;
}

export class FeatureAsset implements IFeatureAsset {
  id: number;
  path: string;
  uuid: string;
  feature_id: number;
  asset_type: string;

  // TODO: Implenent this
  get assetPath(): string {
	return '';
  }

}


interface FeatureStyles {
  [key: string]: string | number;
}


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
  properties: GeoJsonProperties;
  id?: string | number;
  type: any;
  assets?: Array<IFeatureAsset>;
  styles?: FeatureStyles;
  project_id?: number;

  constructor(f: AppGeoJSONFeature) {
	this.geometry = f.geometry;
	this.properties = f.properties;
	this.id = f.id;
	this.type = f.type;
	this.assets = f.assets;
	this.styles = f.styles;
	this.project_id = f.project_id;
  }

  featureType?(): string {
	if (this.assets &&
	this.assets.length === 1) {
	  return this.assets[0].asset_type;
	}

	if (this.assets &&
	this.assets.length > 1) {
	  return 'collection';
	}

	if (!this.assets.length) {
	  return this.geometry.type;
	}



  }
}
