"use strict";

class MultipleFormControlHandler{
    static instance = null;
    static getInstance(){
        if(!this.instance){
            this.instance = new this();
        }
        return this.instance;
    }
    static activate(){
        let instance = this.getInstance();
        instance.printDebug('activate');
        if(instance.activated){ throw('already activated'); }
        if(!globalThis?.window){ throw('window is not exists'); }
        instance.addEventListener(globalThis?.window);
        this.adjustAll()
    }
    static deactivate(){
        let instance = this.getInstance();
        instance.printDebug('deactivate');
        instance.removeEventListener();
    }
    static adjustAll(){
        const instance = this.getInstance();
        document.querySelectorAll('.mfch-container').forEach((container)=>{
            instance.adjust(container)
        })
    }

    //---------------------------

    activated = false;
    listener = null;
    target = null;
    debug = false;

    /**
     * @constructs
     */
    constructor(){
        this.activated = false; //동작
        this.listener = null; // 이벤트를 붙이는 대상. 기본은 window
        this.target = null; // 최초 이벤트 발생 요소(pointerdown 에서 event.target)
        this.reset();
    }
    
    /**
     * 초기화
     */
    reset(){

    }
    /**
     * 디버깅용 (개발용)
     */
    printDebug(){
        if(!this.debug){return;}
        console.log.apply(null, [this.constructor.name , ...arguments]);
    }


    addEventListener(listener){
        this.listener = listener;
        this.listener.addEventListener('keydown',this.cb_keydown);
        this.listener.addEventListener('input',this.cb_keydown);
        this.listener.addEventListener('click',this.cb_click);
        this.listener.addEventListener('focusin',this.cb_focusin);
    }
    removeEventListener(){
        this.listener.removeEventListener('input',this.cb_keydown);
        this.listener.removeEventListener('keydown',this.cb_keydown);
        this.listener.removeEventListener('click',this.cb_click);
        this.listener.removeEventListener('focusin',this.cb_focusin);
    }


    stopEvent(event){
        event.stopPropagation();
        event.preventDefault();
    }

    itemPackageFromTarget(target){
        const container = target.closest('.mfch-container');
        const item = target.closest('.mfch-item'); if(!item){ return null;}
        const input =item.querySelector('input, textarea, select'); if(!input){ return null;}
        return {
            container:container,
            item:item,
            input:input,
        }
    }
    






    getItems(container){
        return container.querySelectorAll('.mfch-item');
    }
    hasEmptyItem(items){
        for(let i=0,m=items.length;i<m;i++){
            let itemPkg = this.itemPackageFromTarget(items[i]);
            if(itemPkg.input.value==''){return i;}
        }
        return -1;
    }
    cloneItem(item){
        let newItem = item.cloneNode(true);
        newItem.querySelectorAll('input , select , textarea').forEach(el => { el.value = ''; });
        return newItem;
    }

    previousItem(item){
        let prev_item = item;
        if(prev_item){
            do{
                prev_item = prev_item.previousElementSibling;
            }while(prev_item && !prev_item.classList.contains('mfch-item'))
        }
        return prev_item;
    }


    appendItem(container,newItem){
        // const minItemNumber = parseInt(container.dataset.mfchMinItemNumber??1);
        const mfchMaxItem = parseInt(container.dataset.mfchMaxItem??0);
        if(mfchMaxItem && mfchMaxItem>0 ){
            if(this.getItems(container).length >=mfchMaxItem){
                console.log('mfchMaxItem');
                return false;
            }

        }
        // items[items.length-1].after(newItem)
        container.appendChild(newItem)

        container.dispatchEvent((new CustomEvent('mfch-appenditem', { 
            bubbles:true, 
            cancelable:true, 
            composed:true,
            detail:{'item':newItem},
        })));
    }

    removeItem(container,item){
        // items[items.length-1].after(newItem)
        const mfchMinItem = parseInt(container.dataset.mfchMinItem??1);
        console.log(mfchMinItem);
        if(mfchMinItem && mfchMinItem>0 ){
            if(this.getItems(container).length <= mfchMinItem){
                console.log('mfchMinItem');
                return false;
            }
        }

        container.removeChild(item);

        container.dispatchEvent((new CustomEvent('mfch-removeitem', { 
            bubbles:true, 
            cancelable:true, 
            composed:true,
            detail:{'item':item},
        })));
    }




    /**
     * 불필요한 빈 요소 삭제
     * @param {HTMLElement} container 
     */
    adjust(itemPkg){
        if(!itemPkg){ this.printDebug('skip: not exists itemPackage'); return;}
        const container = itemPkg.container;
        if(!container){ this.printDebug('skip: not exists container'); return;}
        const item = itemPkg.item;
        if(!item){ this.printDebug('skip: not exists item'); return;}


        let items = this.getItems(container);
        

        // 최대값, 최소값 체크.

        // 중간의 빈 요소 삭제
        {
            let emptyItems=[];
            items.forEach((item)=>{
                const itemPkg = this.itemPackageFromTarget(item);
                if(itemPkg.input.value.length == 0){
                    emptyItems.push(itemPkg.item);
                }
            })
            if(emptyItems.length>1){
                let deleteItems = emptyItems.splice(0,emptyItems.length-1)
                deleteItems.forEach((deleteItem)=>{
                    if(deleteItem==item){return;}
                    this.removeItem(container,deleteItem);
                    console.log('adjust-removeItem');
                })
            }
        }

        if(itemPkg.input.value.length == 0){

        }else{
            // 마지막에 빈 아이템 추가
            let items = this.getItems(container);
            if(this.hasEmptyItem(items)===-1){
                const newItem = this.cloneItem(item);
                this.appendItem(container,newItem);
            }
        }


        container.dispatchEvent((new CustomEvent('mfch-adjust', { 
            bubbles:true, 
            cancelable:true, 
            composed:true,
            detail:{},
        })));
    }




    cb_keydown = (event)=>{ this.keydown(event); }
    keydown(event){
        this.printDebug(event);
        if (event.defaultPrevented) {
            return; // Do nothing if the event was already processed
        }
        return this.processForKeyboard(event);
    }

    cb_focusin = (event)=>{ this.focusin(event); }
    focusin(event){
        this.printDebug(event);
        if (event.defaultPrevented) {
            return; // Do nothing if the event was already processed
        }
        return this.processForFocusin(event);
    }

    cb_click = (event)=>{ this.click(event); }

    click(event){
        this.printDebug(event);
        if (event.defaultPrevented) {
            return; // Do nothing if the event was already processed
        }
        return this.processForClick(event);
    }


    

    processForKeyboard(event){
        const itemPkg = this.itemPackageFromTarget(event.target);
        // console.log(itemPkg);
        if(!itemPkg){ this.printDebug('skip: not exists itemPackage'); return;}
        const container = itemPkg.container;
        if(!container){ this.printDebug('skip: not exists container'); return;}
        const item = itemPkg.item;
        if(!item){ this.printDebug('skip: not exists item'); return;}

        //-- 입력키
        // const key = event.key;

        this.adjust(itemPkg);

        if(itemPkg.input.value.length == 0){
            // 빈 아이템인 경우, 다음의 빈 아이템 요소 삭제

            // 삭제 동작
            if( container.dataset.mfchBackspace!='disabled' && event.key=='Backspace' && !event.repeat){
                this.printDebug('현재 빈 아이템 삭제');
                this.stopEvent(event);
                // this.containerRemoveItem(container,item)
                const previousItem = this.previousItem(item);
                if(previousItem){
                    const previousItemPkg = this.itemPackageFromTarget(previousItem);
                    previousItemPkg.input.focus();
                    previousItemPkg.input.selectionStart = previousItemPkg.input.selectionEnd = previousItemPkg.input.value.length 
                }
                this.removeItem(container,item)
            }
        }else{
            // 마지막에 빈 아이템 추가
            const items = this.getItems(container);
            if(this.hasEmptyItem(items)===-1){
                const newItem = this.cloneItem(item);
                this.appendItem(container,newItem);
            }
        }
    }



    processForFocusin(event){
        const itemPkg = this.itemPackageFromTarget(event.target);
        // console.log(itemPkg);
        if(!itemPkg){ this.printDebug('skip: not exists itemPackage'); return;}
        const container = itemPkg.container;
        if(!container){ this.printDebug('skip: not exists container'); return;}
        const item = itemPkg.item;
        if(!item){ this.printDebug('skip: not exists item'); return;}

        this.adjust(itemPkg);

    }

    processForClick(event){
        const itemPkg = this.itemPackageFromTarget(event.target);
        // console.log(itemPkg);
        if(!itemPkg){ this.printDebug('skip: not exists itemPackage'); return;}
        const container = itemPkg.container;
        if(!container){ this.printDebug('skip: not exists container'); return;}
        const item = itemPkg.item;
        if(!item){ this.printDebug('skip: not exists item'); return;}
        
        this.adjust(itemPkg);

        if(event.target.classList.contains('mfch-item-btn-remove')){
            this.printDebug('제거 버튼 클릭');
            this.stopEvent(event);
            const previousItem = this.previousItem(item);
            if(previousItem){
                const previousItemPkg = this.itemPackageFromTarget(previousItem);
                previousItemPkg.input.focus();
                previousItemPkg.input.selectionStart = previousItemPkg.input.selectionEnd = previousItemPkg.input.value.length 
            }
            this.removeItem(container,item)
        }else if(event.target.classList.contains('mfch-item-btn-append')){
            this.printDebug('추가 버튼 클릭');
            this.stopEvent(event);
            const newItem = this.cloneItem(item);
            this.appendItem(container,newItem);
            
        }
    }
    











    // focusItem(item){
    //     if(!item) return;
    //     item.querySelector('input , select , textarea').focus();
    // }
    // /**
    //  * form-control element 가져오기
    //  */
    // getFirstItem(container){
    //     return container.querySelector('.mfch-item')
    // }
    // /**
    //  * 
    //  * @param {HTMLElement} container 
    //  * @param {HTMLElement} item 
    //  * @param {boolean} forceAppend 강제 추가 여부(빈값 체크등을 안한다.)
    //  */
    // containerAppendItem(container,item,forceAppend){
    //     // 다음요소를 찾아서 비어있다면 이 요소를 대신 사용한다.
    //     let next_item = this.getNextItem(item);
        
    //     let newItem = null;
    //     if(!forceAppend && next_item && next_item.querySelector('input , select , textarea').value ==''){
    //         newItem = next_item;
    //     }else{
    //         let maxItemNumber = parseInt(container.dataset.mfchMaxItemNumber??0);
    //         let itemNumber = this.getItems(container).length;
    //         if(maxItemNumber !== 0 && itemNumber >= maxItemNumber ){
    //             this.printDebug('최대에 도달',itemNumber , maxItemNumber );
    //             return false;
    //         }
    //         newItem = this.appendItem(container,item);
    //     }
    //     // newItem.querySelector('input , select , textarea').focus();
    //     this.adjust(container);
    //     return newItem;
    // }
    // // appendItem(container,item){
    // //     if(!item){
    // //         let items = this.getItems(container);
    // //         item = items[items.length-1];
    // //     } 


    // //     let newItem = item.cloneNode(true);
    // //     newItem.querySelectorAll('input , select , textarea').forEach(el => {
    // //         // el.value = el.defaultValue;
    // //         el.value = '';
    // //     });
    // //     if(item){
    // //         item.after(newItem)
    // //     }else{
    // //         container.appendChild(newItem)
    // //     }
    // //     container.dispatchEvent((new CustomEvent('mfch-appenditem', { 
    // //         bubbles:true, 
    // //         cancelable:true, 
    // //         composed:true,
    // //         detail:{'item':newItem},
    // //     })));

    // //     return newItem
    // // }
    // itemFormControl(item){
    //     return item.querySelector('input,textarea,select')
    // }
    // itemValue(item){
    //     return this.itemFormControl(item).value;
    // }
    // getItems(container){
    //     return container.querySelectorAll('.mfch-item');
    // }
    // getNextItem(item){
    //     let next_item = item;
    //     if(next_item){
    //         do{
    //             next_item = next_item.nextElementSibling;
    //         }while(next_item && !next_item.classList.contains('mfch-item'))
    //     }
    //     return next_item;
    // }
    // getEmptyItem(container){
    //     let next_item = item;
    //     if(next_item){
    //         do{
    //             next_item = next_item.nextElementSibling;
    //         }while(next_item && !next_item.classList.contains('mfch-item'))
    //     }
    //     return next_item;
    // }
    // getPreviousItem(item){
    //     let prev_item = item;
    //     if(prev_item){
    //         do{
    //             prev_item = prev_item.previousElementSibling;
    //         }while(prev_item && !prev_item.classList.contains('mfch-item'))
    //     }
    //     return prev_item;
    // }
    // containerRemoveItem(container,item,disableAutofocus){
    //     if(!item || !item.parentElement){return}

    //     const focus_item = this.removeItem(container,item);
    //     if(!focus_item) return false;
    //     if(!disableAutofocus) focus_item.querySelector('input , select , textarea').focus();
    //     this.adjust(container);
    // }
    // removeItem(container,item){
    //     let minItemNumber = parseInt(container.dataset.mfchMinItemNumber??1);
    //     let itemNumber = this.getItems(container).length;
    //     if(minItemNumber !== 0 && itemNumber <= minItemNumber ){
    //         this.printDebug('최소에 도달',itemNumber , minItemNumber );
    //         return false;
    //     }

    //     let focus_item = this.getPreviousItem(item)??this.getNextItem(item);
    //     if(!focus_item){
    //         this.printDebug('마지막 아이템 삭제 불가');
    //         return false;
    //     }
    //     item.remove();
    //     container.dispatchEvent((new CustomEvent('mfch-removeitem', { 
    //         bubbles:true, 
    //         cancelable:true, 
    //         composed:true,
    //         detail:{'item':item},
    //     })));
    //     return focus_item;
    // }
    






}