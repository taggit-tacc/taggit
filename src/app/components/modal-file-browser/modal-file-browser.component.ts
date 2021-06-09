import {CollectionViewer, SelectionChange, DataSource, SelectionModel} from '@angular/cdk/collections';
import {FlatTreeControl} from '@angular/cdk/tree';
import {BehaviorSubject, merge, Observable, Subject, combineLatest, Subscription, of} from 'rxjs';
import { map } from 'rxjs/operators';
import { Component, OnInit, Injectable, ViewChild, ElementRef, OnDestroy, ɵCompiler_compileModuleSync__POST_R3__ } from '@angular/core';
import {AgaveSystemsService} from '../../services/agave-systems.service';
import {AuthenticatedUser, AuthService} from '../../services/authentication.service';
import { RemoteFile} from 'ng-tapis/models/remote-file'; //RemoteFile is an interface that has properties such as type, length and other callable stuff
import { ApiConfiguration, ApiService, System, SystemSummary} from 'ng-tapis'; // System summary is an interface that has the status and types of the system
import { TapisFilesService } from '../../services/tapis-files.service';
import { BsModalRef } from 'ngx-foundation/modal/bs-modal-ref.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CdkScrollable, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


/** Flat node with expandable and level information */
export class DynamicFlatNode {
  constructor(public item: string, public level = 1, public expandable = false,
              public isLoading = false) {}
}

/**
 * Database for dynamic data. When expanding a node in the tree, the data source will need to fetch
 * the descendants data from the database.
 */
@Injectable({providedIn: 'root'})
export class DynamicDatabase {
  dataMap = new Map<string, string[]>();


  rootLevelNodes: string[] = ['My Data', 'My Projects'];

  /** Initial data from database */
  initialData(): DynamicFlatNode[] {
    return this.rootLevelNodes.map(name => new DynamicFlatNode(name, 0, true));
  }
  

  getChildren(node: string): string[] | undefined {
    return this.dataMap.get(node);
  }


  isExpandable(node: string): boolean {
    return this.dataMap.has(node);
  }
  

}

/**
 * File database, it can build a tree structured Json object from string.
 * Each node in Json object represents a file or a directory. For a file, it has filename and type.
 * For a directory, it has filename and children (a list of files or directories).
 * The input will be a json object string, and the output is a list of `FileNode` with nested
 * structure.
 */
export class DynamicDataSource implements DataSource<DynamicFlatNode> {

  dataChange = new BehaviorSubject<DynamicFlatNode[]>([]);
  myDataCurr_Level: number = 0;
  myProjectsCurr_Level: number = 0;
  PublishedDataCurr_level: number = 0;
  noChild = false;

  get data(): DynamicFlatNode[] { return this.dataChange.value; }
  set data(value: DynamicFlatNode[]) {
    this._treeControl.dataNodes = value;
    this.dataChange.next(value);
  }

  constructor(private _treeControl: FlatTreeControl<DynamicFlatNode>,
              private _database: DynamicDatabase) {}

  connect(collectionViewer: CollectionViewer): Observable<DynamicFlatNode[]> {
    this._treeControl.expansionModel.changed.subscribe(change => {
      if ((change as SelectionChange<DynamicFlatNode>).added ||
        (change as SelectionChange<DynamicFlatNode>).removed) {
        this.handleTreeControl(change as SelectionChange<DynamicFlatNode>);
      }
    });

    return merge(collectionViewer.viewChange, this.dataChange).pipe(map(() => this.data));
  }

  disconnect(collectionViewer: CollectionViewer): void { }


  /** Handle expand/collapse frs */
  handleTreeControl(change: SelectionChange<DynamicFlatNode>) {
    if (change.added) {
      change.added.forEach(node => this.toggleNode(node, true));
    }
    if (change.removed) {
      change.removed.slice().reverse().forEach(node => this.toggleNode(node, false));
    }
  }

  
  /**
   * Toggle the node, remove from display list
   */
  toggleNode(node: DynamicFlatNode, expand: boolean) {
    this.noChild = false
    const children = this._database.getChildren(node.item);
    const index = this.data.indexOf(node);
    if (!children || index < 0) { // If no children, or cannot find the node, no operation
      //put an async await for treeCreate here and reconstruct filepath
      this.noChild = true
      console.log('No Children')
      return;
    }

    node.isLoading = true;
  //make this async, perhaps
    setTimeout(() => {
      if (expand) {
        const nodes = children.map(name =>
          new DynamicFlatNode(name, node.level + 1, this._database.isExpandable(name)));
        this.data.splice(index + 1, 0, ...nodes);
      } else {
        let count = 0;
        for (let i = index + 1; i < this.data.length
          && this.data[i].level > node.level; i++, count++) {}
        this.data.splice(index + 1, count);
      }

      // notify the change
      this.dataChange.next(this.data);
      node.isLoading = false;
    }, 3000);
  }
}



@Component({
  selector: 'app-modal-file-browser',
  templateUrl: './modal-file-browser.component.html',
  styleUrls: ['./modal-file-browser.component.scss'],
  providers: [DynamicDatabase],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
  

export class ModalFileBrowserComponent implements OnInit, OnDestroy {
  
  private currentUser: AuthenticatedUser;
  public filesList: Array<RemoteFile>;
  public inProgress: boolean;
  public selectedFiles: Map<string, RemoteFile> = new Map(); //Current map always being passed to current file/selection
  public onClose: Subject<Array<RemoteFile>> = new Subject<Array<RemoteFile>>();
  public projects: Array<SystemSummary>;
  private selectedSystem: SystemSummary;
  public myDataSystem: SystemSummary;
  public communityDataSystem: SystemSummary;
  public publishedDataSystem: SystemSummary;
  

	
  /** A selected parent node to be inserted */
  selectedParent: DynamicFlatNode[]  | null = null;
  newItemName = '';
  treeControl: FlatTreeControl<DynamicFlatNode>;
  checklistSelection = new SelectionModel<DynamicFlatNode>(true, this.selectedParent /* multiple */);
  showSpinner = false;

  constructor(
    private database: DynamicDatabase,
    private tapisFilesService: TapisFilesService,
//     private modalRef: BsModalRef,
    public dialogRef: MatDialogRef<ModalFileBrowserComponent>,
    private dialog: MatDialog,
    private authService: AuthService,
    private agaveSystemsService: AgaveSystemsService,
    private tapis: ApiService,

  ) {
    this.treeControl = new FlatTreeControl<DynamicFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new DynamicDataSource(this.treeControl, database);
    

    this.dataSource.data = database.initialData();
  }

  ///treeControl: FlatTreeControl<DynamicFlatNode>;

  dataSource: DynamicDataSource;

  getLevel = (node: DynamicFlatNode) => node.level;

  isExpandable = (node: DynamicFlatNode) => node.expandable;

  hasChild = (_: number, _nodeData: DynamicFlatNode) => _nodeData.expandable;

  hasNoContent = (_: number, _nodeData: DynamicFlatNode) => _nodeData.item === '';



  /** Whether all the descendants of the node are selected */
  descendantsAllSelected(node: DynamicFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
	console.log("YOOOOOOOOOOO", descendants)
    const descAllSelected = descendants.length > 0 && descendants.every(child => {
      return this.checklistSelection.isSelected(child);
    });
    return descAllSelected;
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(node: DynamicFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some(child => this.checklistSelection.isSelected(child));
    console.log("YOOO?!?!!??!?!?!?!", result)
	console.log("WHAT", node)
	return result  && !this.descendantsAllSelected(node);
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  todoItemSelectionToggle(node: DynamicFlatNode): void {
    this.checklistSelection.toggle(node);
    console.log(node)
    console.log('Current Selction', this.checklistSelection.selected)
    this.FilePathConstruct(node)
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);
    
    descendants.forEach(child => this.checklistSelection.isSelected(child));
    this.checkAllParentsSelection(node);
  }


  /** Toggle a DynamicNode selection. Check all the parents to see if they changed */
  todoLeafItemSelectionToggle(node: DynamicFlatNode): void {
    this.checklistSelection.toggle(node);
    console.log(node)
    this.checkAllParentsSelection(node);
    console.log('Current Seley', this.checklistSelection.selected)
    let curr_path = this.FilePathConstruct(node)
    if (node.expandable == false )  {
      console.log('CreatingFurtherTree')
      this.MyDataTree(this.RemoteFilePasserConstruct(node))
    }
    // else {
    //   if (node.expandable == true) {
    //     console.log('Creating Tree in MyProjects')
    //     this.MyProjectTree(this.RemoteFilePasserConstruct(node))
    //   }
    // }
  }

  /* Checks all the parents when a leaf node is selected/unselected */
  checkAllParentsSelection(node: DynamicFlatNode): void {
    let parent: DynamicFlatNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /** Check root node checked state and change it accordingly */
  checkRootNodeSelection(node: DynamicFlatNode): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.length > 0 && descendants.every(child => {
      return this.checklistSelection.isSelected(child);
    });
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }


  /* Get the parent node of a node */
  getParentNode(node: DynamicFlatNode): DynamicFlatNode | null {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }
  //the  FileFileFilePathConstructor is reconstructed by calling the parentNode
  //and concatenating the names together
  FilePathConstruct(node:DynamicFlatNode): string {
    let path_returned: string =  node.item 
    let currLevel: number = node.level
    while (this.getParentNode(node) && node.level > 1) {
      const parent = this.getParentNode(node)
      path_returned = parent.item + '/' + path_returned
      node = parent
    }
    return '/' + path_returned
  }
  //

  RemoteFilePasserConstruct(node:DynamicFlatNode): RemoteFile {
  // Problem with this is finding out what kind of system it is and what to use 
  // Use Ian's example in choosing SelectedFiles....perhaps   
    let new_path = this.FilePathConstruct(node)
    let actual_path: string
    if (new_path.indexOf('Root') != -1) {
      actual_path = new_path.slice(5, -1)
      console.log('myProject, confirmed')
      console.log(actual_path)
    }
    else {
      actual_path = new_path
      console.log(actual_path)
    }
    
      let curr_file = <RemoteFile>{
        system : this.myDataSystem.id,
        type: 'dir',
        name: node.item,
        path: actual_path
      }
      return curr_file;
  }





  ngOnInit() {
    this.agaveSystemsService.list()
    // TODO: change those hard coded systemIds to environment vars or some sort of config
    // wait on the currentUser and systems to resolve
    combineLatest([this.authService.currentUser, this.agaveSystemsService.systems, this.agaveSystemsService.projects])
      .subscribe(([user, systems, projects]) => {
        this.myDataSystem = systems.find((sys) => sys.id === 'designsafe.storage.default');
        this.communityDataSystem = systems.find((sys) => sys.id === 'designsafe.storage.community');
        this.publishedDataSystem = systems.find((sys) => sys.id === 'designsafe.storage.published');

        this.selectedSystem = this.myDataSystem;
        this.projects = projects;
        this.currentUser = user; //Create a way to pass all upper data(combineLatest) to a class as root nodes or new functions?
        const init = <RemoteFile>{
          system: this.myDataSystem.id,
          type: 'dir',
          path: this.currentUser.username
        };

        //Uncomment this.MyProjectTree() to let it run on the My Project Database on DesignSafe
        this.MyDataTree(init)
        // this.MyProjectTree();
        //const data = this.database.buildFileTree(this.filesList, 1)
        // console.log(data)
        // this.database.dataChange.next(data);
       


      });
    
  }


  ngOnDestroy() {


  }

  selectSystem(system: SystemSummary): void {
    let pth;
    system.id === this.myDataSystem.id ? pth = this.currentUser.username : pth = '/';
    //system.id === this.projects ? pth = for (project in)
    const init = <RemoteFile>{
      system: system.id,
      type: 'dir',
      path: pth
    };
    this.browse(init);

  }


  

  browse(file: RemoteFile) {
    if (file.type !== 'dir') { return; }
    this.inProgress = true;
    this.selectedFiles.clear();

    this.tapisFilesService.listFiles(file.system, file.path);

    //console.log(await this.tapisFilesService._listing.get
    this.tapisFilesService.listing.subscribe(listing => {
      this.inProgress = false;
      this.filesList = listing;
    });
  

  }

  MyProjectTree() {
    let car: SystemSummary
    let gonelevelDeep: boolean = false
    let BigDirectory: Array<RemoteFile> = [];
    let allPaths: Array<string> = [];
    this.showSpinner = true
    
    for (const car of this.projects) {
    //   console.log('This could be project id', car.id)
    //   console.log(car.name)
    //   console.log(car.description)
    //   console.log(car.status)
    //   console.log(car.type)

     let  GetFiles = async (now: RemoteFile):Promise<RemoteFile[]> => {

       let newt2: any = this.tapisFilesService.listFiles(now.system, now.path);
        return newt2
     }
    
     async function getRemoteList (rem: Array<RemoteFile> ): Promise<RemoteFile[]> {
      if (rem.length == 0) {
        console.log("returning early")
        return
      }
       rem.forEach(function (value, index) {
        console.log(value.type, value.name)
        if (value.type == 'dir' && value.name != ".." && gonelevelDeep == true) {
          console.log('This directory is one level deep', value.path)
          allPaths.push(value.path.concat('/'))
        }
        if (value.type == 'dir' && value.name != ".." && gonelevelDeep == false) {
          console.log('Found Directory at', value.path)
          BigDirectory.push(value.path.concat('/'))
          //allPaths.push(value.path.concat('/'))
        }
        if (value.type == 'file' && !(allPaths.includes(value.path.concat('/'))) && (value.path.indexOf('jpg') !== -1)) {
          console.log('File found at', value.path)
          allPaths.push(value.path.concat('/'))
        }

      }
      )
      console.log(BigDirectory)
      return BigDirectory;
     }
    

      
       let dior = <RemoteFile>{
        system: car.id,
        type: 'storage',
         path: '/'
        
       }
       async function LoopDirectories(directory: Array<RemoteFile>) {
      
        for (let [key, value] of directory.entries()) {  
          dior.path = (value as string).slice(0, -1)
          console.log('FilePath of curr_dir is', dior.path)
          let strong = await GetFiles(dior)
          let awake = await getRemoteList(strong)
          
        }
       }
      
    const treebuild = (turree: string[]) => {
      return this.Treeify(turree)
    }


    async function MakeTree(): Promise<string> {
      console.log('MakeTree began')
      console.log('File_Path Search complete Done')
      if (allPaths.length == 0) {
        console.log('Empty here too')
        return
      }
      let fjson = treebuild(allPaths)
      console.log('Second_One Done')
      //console.log(fjson)
      let fjson2 = JSON.stringify(fjson)
      console.log(fjson2)
      let new_by = fjson2.charAt(1)
      let fjson_2 = fjson2.replace(new_by, '"Root')
      //Before sending to parse, do some string parsing using regext
      let re = /{"":null}/g
      let de = /{"":null,/g
      const new_str = fjson_2.replace(re, 'null')
      const newer_str = new_str.replace(de,'{')
      console.log(newer_str)
      return newer_str
      // let cur = JSON.parse(newer_str)
      // console.log("About to log returnnee")
      // console.log(cur)
      // return cur
      



    }

       async function treeCreate() {
         try {
           console.log("Try1")
           let response = await GetFiles(dior)
  
           console.log(response)
           console.log('Try2')
           let list_1 = await getRemoteList(response)
           console.log('answer received')
           gonelevelDeep = true
           console.log('Try3')
           let list_2 = await LoopDirectories(list_1)
           console.log('Try4')
           if (allPaths.length == 0) {
            console.log('We Found nothing')
            return
          }
           console.log(allPaths)
           
             return allPaths
          
         }
        catch (err) {
          console.log(err)
        }
       };
      let dady = treeCreate();
      let taste = dady.then(result => MakeTree())
      let rain = taste.then(res => this.BuildDataMap(res))
      //let drain = rain.then(dew => this.dataSource.dataChange.next(this.dataSource.dataChange.value))
      rain;
      this.showSpinner = false


       

       

     }
     

      
  }


  //MyDataTree creates the Tree Structure for MyData Databaase on DesignSafe
  //It goes through each RemoteFile and gets the filepath
  MyDataTree(file:RemoteFile) {
    this.showSpinner = true
    let gonelevelDeep: boolean = false
    //BigDirectory is a directory of directories
    let BigDirectory: Array<RemoteFile> = [];
    //All file paths are store in allPaths
    let allPaths: Array<string> = [];


    //treeCreate is the main function that asynchronously calls the next function in creating the tree
    //
    async function treeCreate() {
      try {
        console.log("Try1")
        let response = await GetFiles(file)
        // console.log(response)
        console.log('Try2')
        let list_1 = await getRemoteList(response)
        console.log('answer received')
        gonelevelDeep = true
        console.log('Try3')
        //Handle TypeError in LoopDirectories where .entries == 0, say This is the End 
        let list_2 = await LoopDirectories(list_1)
        list_2;
        console.log('Try4')
        if (allPaths.length == 0) {
          console.log('We Found nothing')
          return
        }
        console.log(allPaths)
        return allPaths
      }
      catch (err) {
        console.log(err)
        console.log('We found an error')
      }
    };
      

    // GetFiles calls the API(tapis) that returns a Promise of RemoteFile (datatype)
    // it goes to get all the RemoteFiles at a specific filepath
     let  GetFiles = async (now: RemoteFile):Promise<RemoteFile[]> => {

       let newt2: any = this.tapisFilesService.listFiles(now.system, now.path);
        return newt2
     }

    //getRemoteList sorts through  the Promise returned by GetFiles 
    //It only allows (image files) [jpg& ..] 
    //It also checks that we do not go more than one level deep at a point. 
    async function getRemoteList (rem: Array<RemoteFile> ): Promise<RemoteFile[]> {
      if (rem.length == 0) {
        // console.log("returning early")
        return
      }
      rem.forEach(function (value, index) {
        if (value.type == 'dir' && value.name != ".." && gonelevelDeep == true) {
        //   console.log('This directory is one level deep', value.path)
          allPaths.push(value.path.concat('/'))
        }
        if (value.type == 'dir' && value.name != ".." && gonelevelDeep == false) {
        //   console.log('Found Directory at', value.path)
          BigDirectory.push(value.path.concat('/'))
          
        }
        if (value.type == 'file' && !(allPaths.includes(value.path.concat('/'))) && (value.path.indexOf('jpg') !== -1)) {
        //   console.log('File found at', value.path)
          allPaths.push(value.path.concat('/'))
        }

      }
      )
      //console.log(BigDirectory)
      return BigDirectory;
    }

    //LoopDirectories goes through BigDirectory 
    //to check if we can go another level further and find images
    async function LoopDirectories(directory: Array<RemoteFile>) {

      for (let [key, value] of directory.entries()) {
        file.path = (value as string).slice(0, -1)
        // console.log(file.path)
        let strong = await GetFiles(file)
        let awake = await getRemoteList(strong)
        awake;
        
      }
    }



    const treebuild = (turree: string[]) => {
      return this.Treeify(turree)
    }


    async function MakeTree(): Promise<string> {
      console.log('MakeTree began')
      console.log('File_Path Search complete Done')
      if (allPaths.length == 0) {
        console.log('Empty here too')
        return
      }
      let fjson = treebuild(allPaths)
      console.log('Second_One Done')
      console.log(fjson)
      let fjson2 = JSON.stringify(fjson)
      //console.log(fjson2)
      let new_by = fjson2.charAt(1)
      let fjson_2 = fjson2.replace(new_by, '"Root')
      //Before sending to parse, do some string parsing using regex
      let re = /{"":null}/g
      let de = /{"":null,/g
      const new_str = fjson_2.replace(re, 'null')
      const newer_str = new_str.replace(de,'{')
      console.log(newer_str)
      return newer_str
      // let cur = JSON.parse(newer_str)
      // console.log(cur)
      // return cur




    };
    
    let initial = treeCreate();
    let taste =  initial.then(result => MakeTree())
    let rain = taste.then(res => this.BuildDataMap(res))
    rain;
    //this.database.dataMap()
    //this.dataSource.dataChange.next(this.database.dataMap)


    this.showSpinner = false
    
    
   
    


  

  };

  BuildDataMap(filepaths: string | any) {
    if (filepaths == null) {
      console.log("Welp!")
      return
    }
    console.log("BuildDataMap begins")
    let count:number = 0
    let array2: string[] = [];
    let array3: Array<string>[]= [];
    let newone: string[] = []
    let count2: number = 0
    let iterable: string
    let MyData: boolean
    let ready = JSON.parse(filepaths)
    if (filepaths.indexOf(this.currentUser.username) != -1) {
      console.log('We are in MyData')
      iterable = ready['Root']
      MyData  = true
    }
    else {
      console.log('We are in MyProjects')
      iterable = ready
      MyData = false
    }
  
  function keepIter(obj:Object | any): void {
    for (let [key, valued] of Object.entries(obj)){
    if (valued == null) {
      newone.push(String(key))
      }
    if (valued != null) {
      array3.push(newone)
        }
    if (valued != null) {
      array2.push(key)
      count += 1
      newone = [];
      keepIter(obj[key])
          
        }           
      }
     
    }
  //
  for (const [yek, value] of Object.entries(iterable)) {
      if (typeof value == 'object') {
      array2.push(yek)
      keepIter(value)
          }
        }
  

  console.log('Header Files')
  console.log(array2)
  array3.push(newone)
  console.log('Babies')
    console.log(array3)
    //Insert another if statement to counter for when we are dataMap is empty
    //Empty? what if we are setting it up for a new MyData or MyProjects
    //Think about the new initial initialization
    let array4:string[] = []
    if (MyData == true) {
      for (let i = 0; i < array2.length; i += 1){
        if (this.database.dataMap.has(array2[i])) {
          console.log('In Keys', array2[i])
          //array4.splice(i, 1)
          count2 += 1 // To show we are not in initial state again
        }
        else {
          array4.push(array2[i])

        }
      }

    }
    
  //console.log(this.database.dataMap)
    if (count2 == 0 && MyData == true) {
      console.log('this the first one for MyData')
      this.database.dataMap.set('My Data', [this.currentUser.username])
    }
    else {
      if (count2 == 0 && MyData == false) {
        console.log('First one for myProjects')
        //why the line below?
      this.database.dataMap.set('My Projects', array4.slice(1,))
      }
    } 
  
  let cons = array4.slice(1,)
  console.log('Logging Values, init')
  console.log(cons)
  console.log('Initial part, Keys', array4[0])
  this.database.dataMap.set(array4[0], cons)
  
  
    for (let i = 1; i < array2.length; i += 1) {
    //Before setting, check if array is not empty, else set not .
      console.log('Key is', array2[i])
      console.log('Value is', array3[i])

        if (array2[i].length != 0 && array3[i].length != 0) {
          console.log('Mapping key to value')
          this.database.dataMap.set(array2[i], array3[i])
        }
    }

    
    //this.dataSource.dataChange.next(this.dataSource.dataChange.getValue())
}


  //Treeify is used to build the FileTree from the filepaths
  //It converts an array of file-paths into a single JSON object representing the file tree using callbacks
  Treeify(files:string[]) {
    let fileTree = {};
    console.log('Treeify has started')
    
    if (files instanceof Array === false) {
      throw new Error('Expected an Array of file paths but received' + files);
    }


  function mergePathsIntoFileTree(prevDir, currDir, i, filePath) {
    if (i === filePath.length - 1) {
      prevDir[currDir] = null;


    }

    if (!prevDir.hasOwnProperty(currDir)) {
      prevDir[currDir] = {};


    }
    return prevDir[currDir];

  }

  function parseFilePath(filePath:string) {
    let file_loc = filePath.split('/');

    if (file_loc.length === 1) {

      return (fileTree[file_loc[0]] = null);

    }
    file_loc.reduce(mergePathsIntoFileTree, fileTree);
    
  }
    
    
  for (let file of files) {

    parseFilePath(file)
    }

	console.log("this is filetree", fileTree)
  return fileTree;

  
    
  }


  //[Ken**] In my new functions, for each new or when isSelected, populate the tree with Browse, right above

  // TODO: Ian: Error message on incorrect file type?
  select(file: RemoteFile) {
    if (this.tapisFilesService.checkIfSelectable(file)) {
      console.log('This can work')
      this.addSelectedFile(file);
    }
    // here?
    // else {
    //   Signal Error!
    // }
  }

  addSelectedFile(file: RemoteFile) {
    if (this.selectedFiles.has(file.path)) {
      this.selectedFiles.delete(file.path);
    } else {
      this.selectedFiles.set(file.path, file);
    }
  }

  chooseFiles() {
    //Get us an  array of RemoteFiles and use the iterator on it
    const chosenFiles: Array<RemoteFile> = []
    console.log('Going at this')
    this.checklistSelection.selected.forEach(value => {
      console.log(value)
      let Rem_File = this.RemoteFilePasserConstruct(value)
      console.log('FilePath to import is', Rem_File)
      chosenFiles.push(Rem_File)
      this.select(Rem_File)
      console.log(Rem_File.path)
      console.log(Rem_File.name)

    })
    
    //console.log('Going at this too')

    //const tmp = Array.from(this.selectedFiles.values());
    // this.onClose.next(tmp);
    // this.modalRef.hide();
    this.dialogRef.close()
  }


  cancel() {
    // this.modalRef.hide();
    this.dialogRef.close()
  }
}




/**  Copyright 2020 Google LLC. All Rights Reserved.
    Use of this source code is governed by an MIT-style license that
    can be found in the LICENSE file at http://angular.io/license */