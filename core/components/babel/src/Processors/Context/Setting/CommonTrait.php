<?php

namespace mikrobi\Babel\Processors\Context\Setting;

use \mikrobi\Babel\Babel;

trait CommonTrait
{
    public $modeNew = 1;
    public $modeUpd = 2;
    
    private $babel = null;
    
    public function runOnSaveEvent($instance, $params)
    {
        $contextKey = $instance->object->get('context_key');
        $context = $this->modx->getObject('modContext', array('key' => $contextKey));
        if(!$context) {
            return;
        }
        $instance->modx->invokeEvent('OnContextSave', [
            'context' => $context,
            'mode' => $params,
        ]);
    }
    
    public function getBabel() 
    {
        if(!$this->babel) {
            $corePath = $this->modx->getOption('babel.core_path', null, $this->modx->getOption('core_path') . 'components/babel/');
            $this->babel = $this->modx->getService('babel', 'Babel', $corePath . 'model/babel/');
        }
        
        return $this->babel;
    }
    
    public function removeGroupContextSetting()
    {
        $currentCtx = $this->object->get('context_key');
        $keysToGroup = $this->babel->contextKeyToGroup[$currentCtx];
        
        if(is_array($keysToGroup)) {
            foreach($keysToGroup as $context) {
                if($currentCtx == $context) continue;
                
                $removeContextSetting = $this->modx->getObject('modContextSetting', [
                    'context_key' => $context,
                    'key' => $this->getProperty('key'),
                ]);
                if(!$removeContextSetting) continue;
                
                $removeContextSetting->remove();
            }
        }
    }
}